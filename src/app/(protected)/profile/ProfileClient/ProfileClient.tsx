"use client";

import { App, Card } from "antd";
import Link from "next/link";
import { BackButton } from "@/components/BackButton/BackButton";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { PageHeader } from "@/components/PageHeader";
import { TelegramLinkPanel } from "@/components/TelegramLinkPanel/TelegramLinkPanel";
import { ChangeEmailModal } from "./components/ChangeEmailModal/ChangeEmailModal";
import { ChangePasswordModal } from "./components/ChangePasswordModal/ChangePasswordModal";
import { DeleteProfileModal } from "./components/DeleteProfileModal/DeleteProfileModal";
import { DeleteProfileSection } from "./components/DeleteProfileSection/DeleteProfileSection";
import { ProfileDetailsForm } from "./components/ProfileDetailsForm/ProfileDetailsForm";
import { PROFILE_LABELS } from "./constants/profileConstants";
import { useProfileClient } from "./hooks/useProfileClient";
import type { ProfileClientProps } from "./types/profileTypes";
import styles from "./ProfileClient.module.scss";

export const ProfileClient = ({ userData: initialUserData }: ProfileClientProps) => {
  const { message } = App.useApp();
  const {
    profileForm,
    passwordForm,
    emailForm,
    deleteProfileForm,
    userData,
    initialValues,
    timezoneOptions,
    hasProfileChanges,
    isEmailVerified,
    canDeleteProfile,
    passwordModalOpen,
    emailModalOpen,
    deleteProfileModalOpen,
    savingProfile,
    savingPassword,
    savingEmail,
    deletingProfile,
    handleProfileValuesChange,
    handleSaveProfile,
    openPasswordModal,
    openEmailModal,
    openDeleteProfileModal,
    closePasswordModal,
    closeEmailModal,
    closeDeleteProfileModal,
    handleChangePassword,
    handleChangeEmail,
    handleDeleteProfile,
  } = useProfileClient({
    initialUserData,
    messageApi: message,
  });

  return (
    <main className={styles.profile}>
      <Card className={styles.panel}>
        <PageHeader
          title={PROFILE_LABELS.title}
          actions={
            <Link href="/dashboard">
              <BackButton />
            </Link>
          }
        />

        <EmailVerificationBanner />

        <ProfileDetailsForm
          form={profileForm}
          userData={userData}
          initialValues={initialValues}
          timezoneOptions={timezoneOptions}
          hasProfileChanges={hasProfileChanges}
          isEmailVerified={isEmailVerified}
          savingProfile={savingProfile}
          onValuesChange={handleProfileValuesChange}
          onSaveProfile={handleSaveProfile}
          onOpenEmailModal={openEmailModal}
          onOpenPasswordModal={openPasswordModal}
        />

        <div className={styles.telegramSection}>
          <TelegramLinkPanel />
        </div>

        <DeleteProfileSection
          canDeleteProfile={canDeleteProfile}
          onOpenDeleteModal={openDeleteProfileModal}
        />
      </Card>

      <ChangeEmailModal
        form={emailForm}
        open={emailModalOpen}
        saving={savingEmail}
        onCancel={closeEmailModal}
        onSubmit={handleChangeEmail}
      />

      <ChangePasswordModal
        form={passwordForm}
        open={passwordModalOpen}
        saving={savingPassword}
        onCancel={closePasswordModal}
        onSubmit={handleChangePassword}
      />

      <DeleteProfileModal
        form={deleteProfileForm}
        open={deleteProfileModalOpen}
        saving={deletingProfile}
        onCancel={closeDeleteProfileModal}
        onSubmit={handleDeleteProfile}
      />
    </main>
  );
};
