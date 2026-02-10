"use client";
import { Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { ProfileForm } from "./ProfileForm";

export const UserProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    id: "",
    email: "",
    password: "",
    name: "",
    lastName: "",
    gender: "",
    timezone: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await fetch("/api/getUser", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }).then((result) => {
          return result.json();
        });
        setUserData({
          id: data.user.id,
          email: data.user.email,
          password: data.user.password,
          name: data.user.name,
          lastName: data.user.lastName,
          gender: data.user.gender,
          timezone: data.user.timezone,
        });
      } catch (error) {
        console.log(`Ошибка: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100vh" }}>
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    );
  }
  return <ProfileForm userData={userData} />;
};
