"use client";

import { App } from "antd";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { TelegramLinkPanel } from "@/components/TelegramLinkPanel/TelegramLinkPanel";
import { AccountSecuritySection } from "./components/AccountSecuritySection/AccountSecuritySection";
import { ChangeEmailModal } from "./components/ChangeEmailModal/ChangeEmailModal";
import { ChangePasswordModal } from "./components/ChangePasswordModal/ChangePasswordModal";
import { DeleteProfileModal } from "./components/DeleteProfileModal/DeleteProfileModal";
import { DeleteProfileSection } from "./components/DeleteProfileSection/DeleteProfileSection";
import { ProfileDetailsForm } from "./components/ProfileDetailsForm/ProfileDetailsForm";
import { ProfileHeader } from "./components/ProfileHeader/ProfileHeader";
import { ProfileOverview } from "./components/ProfileOverview/ProfileOverview";
import { ProfileSection } from "./components/ProfileSection/ProfileSection";
import { PROFILE_SECTIONS } from "./constants/profileConstants";
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
    <div className={styles.profile}>
      <ProfileHeader hasUnsavedChanges={hasProfileChanges} />
      <EmailVerificationBanner />

      <div className={styles.layout}>
        <ProfileOverview userData={userData} canDeleteProfile={canDeleteProfile} />

        <div className={styles.settingsPanel}>
          <ProfileDetailsForm
            form={profileForm}
            initialValues={initialValues}
            timezoneOptions={timezoneOptions}
            hasProfileChanges={hasProfileChanges}
            savingProfile={savingProfile}
            onValuesChange={handleProfileValuesChange}
            onSaveProfile={handleSaveProfile}
          />

          <ProfileSection
            id={PROFILE_SECTIONS.TELEGRAM.id}
            index={PROFILE_SECTIONS.TELEGRAM.index}
            title={PROFILE_SECTIONS.TELEGRAM.title}
            description={PROFILE_SECTIONS.TELEGRAM.description}
          >
            <TelegramLinkPanel showHeader={false} />
          </ProfileSection>

          <AccountSecuritySection
            email={userData.email}
            isEmailVerified={isEmailVerified}
            onOpenEmailModal={openEmailModal}
            onOpenPasswordModal={openPasswordModal}
          />

          <DeleteProfileSection
            canDeleteProfile={canDeleteProfile}
            onOpenDeleteModal={openDeleteProfileModal}
          />
        </div>
      </div>

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
    </div>
  );
};
