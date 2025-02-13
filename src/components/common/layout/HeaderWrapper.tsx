"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/common/Header";
import UserHeader from "@/components/user/UserHeader";

const USER_PAGE_HEADER_PATHS = [
  "/user/edit_profile",
  "/user/create_review",
  "/user/edit_review",
  { pattern: /^\/user\/\d+$/, description: "user detail page" },
];

const HIDE_HEADER_PATHS = ["/sign-in"];

export default function HeaderWrapper() {
  const pathname = usePathname();
  const userPageHeader = USER_PAGE_HEADER_PATHS.some((path) => {
    if (typeof path === "object" && path.pattern instanceof RegExp) {
      return path.pattern.test(pathname || "");
    }

    return pathname === path;
  });
  const isHideHeader = HIDE_HEADER_PATHS.some((path) => pathname === path);

  if (isHideHeader) return null;

  if (userPageHeader) return <UserHeader />;

  return <Header />;
}
