import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import JoinToast from "@/components/toast/JoinToast";
import {
  deleteUserWishList,
  addUserWishlist,
} from "@/lib/wishlist/wishlistApi";
import useUserWishlist from "@/store/wishlist/useUserWishlist";
import { type CardProps, type WishlistMutationProps } from "@/types/card";

interface WishlistProps {
  meetupId: number;
  callback?: () => void;
}

export default function useChangeWishlist() {
  const queryClient = useQueryClient();
  const { userAllWishlist, setUserAllWishlist } = useUserWishlist();
  const router = useRouter();

  const JoinToastOption = {
    containerId: "joinArea",
    closeButton: false,
    className: "join-toast",
    hideProgressBar: true,
  };

  const deleteMutation = useMutation({
    mutationFn: ({ meetupId }: WishlistProps) => deleteUserWishList(meetupId),
    onMutate: ({ meetupId }: WishlistProps) => {
      //낙관적 업데이트
      //이전 찜한 목록 상태를 가져온다
      const prevWishlist = queryClient.getQueryData<WishlistMutationProps>([
        "userAllWishlist",
      ]);

      if (prevWishlist) {
        //API 완료를 기다리지 않고 일단 반영
        const formatData = prevWishlist.data.map(
          (item: CardProps) => item.meetupId,
        );

        const updatedWishlist = [...formatData].filter(
          (item: number) => item !== meetupId,
        );

        setUserAllWishlist(updatedWishlist);
        queryClient.setQueryData(["userAllWishlist"], updatedWishlist);
      }

      //이전 상태를 onError에 context로 저장장
      return { prevWishlist };
    },
    onError: (_, __, context) => {
      //에러가 났으면 다시 이전 데이터로 롤백
      if (context?.prevWishlist) {
        const rollback = context.prevWishlist.data.map(
          (item: CardProps) => item.meetupId,
        );

        setUserAllWishlist(rollback);
        queryClient.setQueryData(["userAllWishlist"], context.prevWishlist);
      }
      toast(
        (props) => <JoinToast {...props} toastType='failed' />,
        JoinToastOption,
      );
    },
    onSuccess: () => {
      toast(
        (props) => <JoinToast {...props} toastType='wishlistRemove' />,
        JoinToastOption,
      );
    },
    onSettled: () => {
      //API 성공 여부에 상관없이 실행하는 콜백
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("userAllWishlist"),
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("wishlist"),
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: ({ meetupId }: WishlistProps) => {
      return addUserWishlist(meetupId);
    },
    onMutate: ({ meetupId }: WishlistProps) => {
      const prevWishlist = queryClient.getQueryData<WishlistMutationProps>([
        "userAllWishlist",
      ]);

      if (prevWishlist) {
        const updatedWishlist = [...prevWishlist.data].map(
          (item) => item.meetupId,
        );
        setUserAllWishlist([...updatedWishlist, meetupId]);
        queryClient.setQueryData(["userAllWishlist"], updatedWishlist);
      }

      return { prevWishlist };
    },
    onError: (_, __, context) => {
      if (context?.prevWishlist) {
        const rollback = context.prevWishlist?.data.map(
          (item: CardProps) => item.meetupId,
        );
        setUserAllWishlist(rollback);
        queryClient.setQueryData(["userAllWishlist"], context.prevWishlist);
      }
      toast(
        (props) => <JoinToast {...props} toastType='failed' />,
        JoinToastOption,
      );
    },
    onSuccess: () => {
      toast(
        (props) => <JoinToast {...props} toastType='wishlistAdd' />,
        JoinToastOption,
      );
    },
    onSettled: () => {
      //API 성공 여부에 상관없이 실행하는 콜백
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("userAllWishlist"),
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes("wishlist"),
      });
    },
  });

  //로그인한 사용자의 찜하기 기능
  const loggedInWishlist = (
    meetupId: number,
    meetupStatus: "RECRUITING" | "IN_PROGRESS" | "COMPLETED" | "BEFORE_START",
  ) => {
    if (meetupStatus === "RECRUITING") {
      const isIncludeArr = userAllWishlist.includes(meetupId);

      //찜하기를 클릭했을 때 이미 찜하기에 등록 된 데이터
      if (isIncludeArr) {
        if (deleteMutation.isPending) return;
        deleteMutation.mutate({ meetupId: meetupId });
      } else {
        if (addMutation.isPending) return;
        addMutation.mutate({ meetupId: meetupId });
      }
    } else {
      toast(
        (props) => <JoinToast {...props} toastType='wishlistError' />,
        JoinToastOption,
      );
    }
  };

  // 로그인하지 않은 사용자의 찜하기 기능
  const nonLoggedInWishlist = (
    meetupId: number,
    meetupStatus: "RECRUITING" | "IN_PROGRESS" | "COMPLETED" | "BEFORE_START",
    stateSetter: (
      state: number[] | ((prevState: number[]) => number[]),
    ) => void,
  ) => {
    if (meetupStatus === "RECRUITING") {
      const myWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

      //이미 추가되었는지 확인
      if (!myWishlist.includes(meetupId)) {
        //새로운 모임을 로컬 스토리지에 추가
        const newWishlist = [...myWishlist, meetupId];
        localStorage.setItem("wishlist", JSON.stringify(newWishlist));
        toast(
          (props) => <JoinToast {...props} toastType='wishlistAdd' />,
          JoinToastOption,
        );
      } else {
        const idx = myWishlist.indexOf(meetupId);
        //로컬스토리지에서 모임 요소 삭제
        const newWishlist = [...myWishlist];
        newWishlist.splice(idx, 1);

        localStorage.setItem("wishlist", JSON.stringify(newWishlist));
        toast(
          (props) => <JoinToast {...props} toastType='wishlistRemove' />,
          JoinToastOption,
        );
      }

      //toggleWishlist는 로컬 스토리지에 아이디를 추가 또는 삭제
      const storage = JSON.parse(localStorage.getItem("wishlist") || "[]");

      if (myWishlist != storage) stateSetter(storage);

      //쿼리 다시 실행
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      router.refresh();
    } else {
      toast(
        (props) => <JoinToast {...props} toastType='wishlistError' />,
        JoinToastOption,
      );
    }
  };

  return { loggedInWishlist, nonLoggedInWishlist };
}
