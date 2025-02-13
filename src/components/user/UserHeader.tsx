"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Dropdown from "../common/Dropdown";
import BackButton from "./BackButton";
import Edit from "@/assets/images/icons/edit.svg";
import LogoIcon from "@/assets/images/icons/mogua.svg";
import PlusIcon from "@/assets/images/icons/plus-thin.svg";
import useSignOut from "@/hooks/auths/useSignOut";
import { getUserProfile } from "@/lib/user/getUserProfile";
import useUserStore, { type User } from "@/store/auth/useUserStore";

const EXCLUDED_USER_PATHS = [
  "/user/edit_profile",
  "/user/create_review",
  "/user/edit_review",
];

function CreateButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.push("/create")} aria-label='Create Meetup'>
      <PlusIcon className='text-gray-200' />
    </button>
  );
}

function ProfileImage({ user }: { user: User }) {
  const { handleSignOut } = useSignOut();

  return (
    <div className='size-6'>
      <Dropdown
        content={[
          {
            label: "로그아웃",
            value: "logout",
            onClick: handleSignOut,
          },
        ]}
        isHeader={true}
      >
        <Image
          src={user.profileImg ?? "/images/default_user_profile.png.png"}
          alt='Profile'
          className='size-6 cursor-pointer rounded-full'
          width={24}
          height={24}
          sizes='(max-width: 640px) 24px, 32px'
        />
      </Dropdown>
    </div>
  );
}

function MoguaLogo({ className = "" }: { className?: string }) {
  return (
    <Link className={className} href='/'>
      <LogoIcon aria-label='mogua' />
    </Link>
  );
}

function NavigationLinks({ user }: { user: User | null }) {
  const NAV_ITEMS = [
    { href: "/", label: "모임찾기" },
    { href: "/wishlist", label: "북마크" },
    {
      href: user ? `/user/${user.userId}` : "/sign-in",
      label: "마이페이지",
    },
  ];

  return (
    <nav className='hidden desktop:block'>
      <ul className='flex gap-8'>
        {NAV_ITEMS.map(({ href, label }) => (
          <li key={label}>
            <Link
              href={href}
              className='body-1-normal text-gray-300 hover:text-gray-100'
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function UserHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [headerKey, setHeaderKey] = useState(0);

  const isUserPage =
    pathname.startsWith("/user/") &&
    !EXCLUDED_USER_PATHS.includes(pathname) &&
    pathname.split("/").length === 3;

  const isEditProfile = pathname === "/user/edit_profile";
  const isCreateReview = pathname === "/user/create_review";
  const isEditReview = pathname === "/user/edit_review";

  const isReviewPage = isCreateReview || isEditReview;

  const currentUserId = isUserPage ? Number(pathname.split("/")[2]) : null;
  const isMyPage = currentUserId === user?.userId;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const hasImageChanged = sessionStorage.getItem("profileImageChanged");
    if (hasImageChanged) {
      setHeaderKey((prev) => prev + 1);
    }
  }, [pathname]);

  // 프로필 이미지 변경 감지 및 업데이트
  useEffect(() => {
    const updateProfileImage = async () => {
      const hasImageChanged = sessionStorage.getItem("profileImageChanged");

      if (user && hasImageChanged) {
        try {
          const data = await getUserProfile(user.userId.toString());
          setUser({
            ...user,
            profileImg: data.profileImg,
          });

          const localUser = localStorage.getItem("user");
          if (localUser) {
            const parsedUser = JSON.parse(localUser);
            parsedUser.profileImg = data.profileImg;
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }

          sessionStorage.removeItem("profileImageChanged");
        } catch (error) {
          console.error("[프로필 이미지 URL 조회 실패]:", error);
        }
      }
    };

    updateProfileImage();
  }, [user, setUser, headerKey]);

  const headerBgColor = isEditProfile
    ? "bg-gray-900 desktop:bg-gray-950"
    : "bg-[#0E0E10]";
  const headerBorderColor = isReviewPage
    ? "border-b border-gray-900 tablet:border-none"
    : "";

  function HeaderButtons({
    user,
    className = "",
  }: {
    user: User | null;
    className?: string;
  }) {
    return (
      <div className={`flex gap-6 transition-all ${className}`}>
        <CreateButton />
        {user && <ProfileImage user={user} />}
      </div>
    );
  }

  const renderRightButtons = () => {
    if (!mounted) return null;

    if (isReviewPage) {
      return (
        <>
          <span className='mobile:block text-gray-200 tablet:hidden'>
            <BackButton />
          </span>
          <HeaderButtons user={user} className='hidden desktop:flex' />
        </>
      );
    }

    if (isEditProfile) {
      return (
        <>
          <span className='text-gray-200 desktop:hidden'>
            <BackButton />
          </span>
          <HeaderButtons user={user} className='hidden desktop:flex' />
        </>
      );
    }

    if (isUserPage) {
      if (isMyPage) {
        return (
          <button
            onClick={() => router.push("/user/edit_profile")}
            aria-label='Edit Profile'
          >
            <Edit className='text-gray-200' />
          </button>
        );
      }
      return <HeaderButtons user={user} />;
    }

    return null;
  };

  return (
    <header
      className={`fixed left-0 top-0 z-50 flex w-full items-center justify-center ${headerBgColor} ${headerBorderColor}`}
    >
      <div className='flex h-14 w-full max-w-[1240px] items-center justify-between px-5 py-2.5'>
        <div className='flex items-center gap-12'>
          <h1>
            {isReviewPage ? (
              <>
                <span className='mobile:block text-gray-200 tablet:hidden'>
                  {isCreateReview ? "리뷰 작성하기" : "리뷰 수정하기"}
                </span>
                <MoguaLogo className='hidden tablet:block' />
              </>
            ) : (
              <MoguaLogo />
            )}
          </h1>
          {mounted && <NavigationLinks user={user} />}
        </div>

        <div>
          <div className='flex gap-6'>{renderRightButtons()}</div>
        </div>
      </div>
    </header>
  );
}
