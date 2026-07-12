"use client";

import { Typography } from "antd";
import { PROFILE_LABELS, PROFILE_NAV_ITEMS } from "../../constants/profileConstants";
import type { ProfileUserData } from "../../types/profileTypes";
import {
  getProfileDisplayName,
  getProfileInitials,
  getProfileRoleLabel,
} from "../../utils/profileUtils";
import styles from "./ProfileOverview.module.scss";

type ProfileOverviewProps = {
  userData: ProfileUserData;
  canDeleteProfile: boolean;
};

export function ProfileOverview({ userData, canDeleteProfile }: ProfileOverviewProps) {
  const displayName = getProfileDisplayName(userData);
  const initials = getProfileInitials(userData);
  const roleLabel = getProfileRoleLabel(userData.role);
  const navigationItems = PROFILE_NAV_ITEMS.filter((item) => {
    if ("requiresDeletePermission" in item && item.requiresDeletePermission) {
      return canDeleteProfile;
    }

    return true;
  });

  return (
    <aside className={styles.panel} aria-labelledby="profile-overview-title">
      <div className={styles.identity}>
        <div className={styles.avatar} aria-hidden>
          {initials}
        </div>
        <div className={styles.identityText}>
          <span className={styles.role}>{roleLabel}</span>
          <Typography.Title id="profile-overview-title" level={2} className={styles.name}>
            {displayName}
          </Typography.Title>
          <span className={styles.login}>@{userData.login}</span>
        </div>
      </div>

      <nav className={styles.navigation} aria-label={PROFILE_LABELS.sectionNavigationLabel}>
        <span className={styles.navigationLabel}>{PROFILE_LABELS.sectionNavigationLabel}</span>
        <ol className={styles.navigationList}>
          {navigationItems.map((item) => (
            <li key={item.id}>
              <a className={styles.navigationLink} href={`#${item.id}`}>
                <span className={styles.navigationIndex} aria-hidden>
                  {item.index}
                </span>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
