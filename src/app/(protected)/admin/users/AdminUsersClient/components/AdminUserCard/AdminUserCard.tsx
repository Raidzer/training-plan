import { CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { ADMIN_USERS_LABELS } from "../../constants/adminUsersConstants";
import type { AdminUserRow, OpenAdminUserModal } from "../../types/adminUsersTypes";
import {
  formatDate,
  getGenderLabel,
  getRoleMeta,
  getRosterNumber,
  getUserInitials,
  getUserLabel,
} from "../../utils/adminUsersUtils";
import { AdminUserActions } from "../AdminUserActions/AdminUserActions";
import styles from "./AdminUserCard.module.scss";

type AdminUserCardProps = {
  user: AdminUserRow;
  currentUserId: number | null;
  savingStatusId: number | null;
  clearingUserDataId: number | null;
  deletingUserId: number | null;
  onOpenRoleModal: OpenAdminUserModal;
  onOpenPasswordModal: OpenAdminUserModal;
  onStatusToggle: (user: AdminUserRow) => void;
  onClearUserTrainingData: (user: AdminUserRow) => void;
  onDeleteUser: (user: AdminUserRow) => void;
};

export function AdminUserCard({
  user,
  currentUserId,
  savingStatusId,
  clearingUserDataId,
  deletingUserId,
  onOpenRoleModal,
  onOpenPasswordModal,
  onStatusToggle,
  onClearUserTrainingData,
  onDeleteUser,
}: AdminUserCardProps) {
  const roleMeta = getRoleMeta(user.role);
  const userLabel = getUserLabel(user);
  const isCurrentUser = currentUserId === user.id;

  return (
    <article className={styles.card} data-status={user.isActive ? "active" : "disabled"}>
      <div className={styles.cardTopline}>
        <span className={styles.rosterNumber}>
          {ADMIN_USERS_LABELS.rosterNumberLabel} {getRosterNumber(user.id)}
        </span>
        <span className={styles.status} data-active={user.isActive ? "true" : "false"}>
          {user.isActive ? <CheckCircleOutlined aria-hidden /> : <StopOutlined aria-hidden />}
          <span>
            {user.isActive ? ADMIN_USERS_LABELS.activeStatus : ADMIN_USERS_LABELS.disabledStatus}
          </span>
        </span>
      </div>

      <div className={styles.identity}>
        <div className={styles.avatar} aria-hidden>
          {getUserInitials(user)}
        </div>
        <div className={styles.identityCopy}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{userLabel}</h3>
            {isCurrentUser ? (
              <span className={styles.currentUser}>{ADMIN_USERS_LABELS.currentUserBadge}</span>
            ) : null}
          </div>
          <a className={styles.email} href={`mailto:${user.email}`}>
            {user.email}
          </a>
        </div>
      </div>

      <div className={styles.badges}>
        <span className={styles.roleBadge} data-role={roleMeta.tone}>
          {roleMeta.label}
        </span>
        <span className={styles.genderBadge}>{getGenderLabel(user.gender)}</span>
      </div>

      <dl className={styles.details}>
        <div className={styles.detail}>
          <dt>{ADMIN_USERS_LABELS.loginColumn}</dt>
          <dd>{user.login || "—"}</dd>
        </div>
        <div className={styles.detail}>
          <dt>{ADMIN_USERS_LABELS.createdAtColumn}</dt>
          <dd>{formatDate(user.createdAt)}</dd>
        </div>
        <div className={styles.detailWide}>
          <dt>{ADMIN_USERS_LABELS.lastActiveAtColumn}</dt>
          <dd>{formatDate(user.lastActiveAt ?? "")}</dd>
        </div>
      </dl>

      <AdminUserActions
        user={user}
        isCurrentUser={isCurrentUser}
        savingStatusId={savingStatusId}
        clearingUserDataId={clearingUserDataId}
        deletingUserId={deletingUserId}
        onOpenRoleModal={onOpenRoleModal}
        onOpenPasswordModal={onOpenPasswordModal}
        onStatusToggle={onStatusToggle}
        onClearUserTrainingData={onClearUserTrainingData}
        onDeleteUser={onDeleteUser}
      />
    </article>
  );
}
