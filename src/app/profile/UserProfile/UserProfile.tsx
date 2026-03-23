"use client";
import { Spin, Flex, Result, Button } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useState } from "react";
import { ProfileForm } from "./ProfileForm";
import { useRouter } from "next/navigation";

export const UserProfile = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    id: "",
    email: "",
    password: "",
    name: "",
    lastName: "",
    gender: "",
    timezone: "",
  });

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/getUser", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // Проверяем статус ответа
      if (!response.ok) {
        if (response.status === 401) {
          // Неавторизован - перенаправляем на логин
          router.push("/login");
          return;
        }

        // Другие ошибки
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Проверяем наличие данных пользователя
      if (!data.user) {
        throw new Error("Данные пользователя не найдены");
      }

      // Валидируем структуру данных
      const user = data.user;
      setUserData({
        id: user.id || "",
        email: user.email || "",
        password: user.password || "",
        name: user.name || "",
        lastName: user.lastName || "",
        gender: user.gender || "",
        timezone: user.timezone || "Europe/Moscow", // Значение по умолчанию
      });

      setError(null);
    } catch (error) {
      console.error("Ошибка при загрузке данных пользователя:", error);

      setError(error instanceof Error ? error.message : "Не удалось загрузить данные профиля");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchUserData();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100vh" }}>
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex align="center" justify="center" style={{ height: "100vh" }}>
        <Result
          status="error"
          title="Ошибка загрузки профиля"
          subTitle={error}
          extra={[
            <Button type="primary" key="retry" onClick={handleRetry}>
              Попробовать снова
            </Button>,
            <Button key="logout" onClick={handleLogout}>
              Выйти
            </Button>,
          ]}
        />
      </Flex>
    );
  }

  return <ProfileForm userData={userData} />;
};
