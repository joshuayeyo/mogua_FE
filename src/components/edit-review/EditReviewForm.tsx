"use client";

import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { DotLoader } from "react-spinners";
import SolidButton from "@/components/common/buttons/SolidButton";
import CommonTextArea from "@/components/common/inputs/TextArea";
import { FailModal } from "@/components/create/modals/ResultInfoModal";
import RatingInput from "@/components/create-reaview/RatingInput";
import ReviewImageInput from "@/components/create-reaview/ReviewImageInput";
import useReviewModals from "@/hooks/review/useReviewModals";
import { getReview } from "@/lib/review/reviewApi";
import modal from "@/utils/modalController";

interface ReviewFormData {
  rating: number;
  content: string;
  image: File | null;
}

export default function EditReviewForm({ reviewId }: { reviewId: string }) {
  const { handleUpdateReview } = useReviewModals();
  const [isLoading, setIsLoading] = useState(true);
  const [review, setReview] = useState<any>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const data = await getReview(reviewId);
        setReview(data);
      } catch (error) {
        console.error("리뷰 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
  }, [reviewId]);

  const methods = useForm<ReviewFormData>({
    defaultValues: {
      rating: -1,
      content: "",
      image: null,
    },
    mode: "onChange",
  });

  const { handleSubmit, setValue, watch } = methods;

  useEffect(() => {
    if (review) {
      setValue("rating", review.rating);
      setValue("content", review.content);
    }
  }, [review, setValue]);

  const rating = watch("rating");
  const content = watch("content");
  const image = watch("image");
  const isFormValid = rating !== -1 && content.trim() !== "";

  const getChangedFields = () => {
    if (!review) return null;

    // 변경사항이 없더라도 현재 값을 전송해야함
    // content: 서버에서 null을 허용하지 않으므로 항상 포함
    // rating: 보내지않으면 강제로 1로 설정되므로 기존 rating을 보내줌
    const changes: {
      image?: File;
      requestData?: any;
      hasChanges: boolean;
    } = {
      requestData: {
        rating: rating !== -1 ? rating : review.rating,
        content: content || review.content,
      },
      hasChanges: false,
    };

    if (content !== review.content || rating !== review.rating) {
      changes.hasChanges = true;
    }

    // 이미지 변경 여부 확인
    if (image) {
      changes.image = image;
      changes.hasChanges = true;
    }

    return changes;
  };

  const handleRatingChange = (value: number) => {
    setValue("rating", value);
  };

  const handleImageSelect = (image: File | null) => {
    setValue("image", image);
  };

  const onSubmit = handleSubmit(async () => {
    const changes = getChangedFields();
    if (!changes) return;

    // 변경사항이 없을 때 알림
    if (!changes.hasChanges && !changes.image) {
      modal.open(
        ({ close }) => (
          <FailModal
            title='변경된 내용이 없습니다.'
            message='수정할 내용을 입력해주세요.'
            close={close}
          />
        ),
        {
          hasCloseBtn: false,
          isBottom: false,
        },
      );
      return;
    }

    const formData = new FormData();

    formData.append(
      "request",
      new Blob([JSON.stringify(changes.requestData || {})], {
        type: "application/json",
      }),
    );

    if (changes.image) {
      formData.append("image", changes.image);
    }

    await handleUpdateReview(reviewId, formData);
  });

  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-212px)] w-full items-center justify-center'>
        <DotLoader
          size={24}
          color={"#FF9A42"}
          cssOverride={{ position: "absolute" }}
          loading={isLoading}
        />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <div className='flex flex-col gap-12'>
          <RatingInput
            value={methods.watch("rating")}
            onChange={handleRatingChange}
          />
          <CommonTextArea
            formClassName='h-40'
            required={true}
            name='content'
            label='구체적인 경험을 알려주세요'
            placeholder='모임의 장소, 환경, 진행, 구성 등 만족스러웠나요?'
            maxLength={150}
          />
          <ReviewImageInput
            onImageSelect={handleImageSelect}
            imageUrl={review?.thumbnail || null}
          />
        </div>
        <SolidButton
          type='submit'
          className='mt-10'
          state={
            !isFormValid
              ? "inactive"
              : getChangedFields()?.hasChanges
                ? "activated"
                : "default"
          }
        >
          수정 완료
        </SolidButton>
      </form>
    </FormProvider>
  );
}
