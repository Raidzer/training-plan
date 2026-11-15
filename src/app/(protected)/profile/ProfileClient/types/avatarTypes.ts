export type AvatarSource = {
  url: string;
  image: HTMLImageElement;
};

export type AvatarOperation = "loading" | "saving" | "deleting" | null;
