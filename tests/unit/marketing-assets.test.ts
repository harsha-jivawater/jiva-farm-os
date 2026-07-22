import { describe, expect, it } from "vitest";
import {
  canEditMarketingAssetDetails,
  canReviewMarketingAsset,
  marketingUploaderRole,
  reviewRoleForUploader,
  uploaderCanSelfPublish
} from "@/lib/marketing-assets/permissions";
import {
  marketingAssetInputFromForm,
  validateMarketingAssetInput,
  youtubeEmbedUrl,
  youtubeVideoId
} from "@/lib/marketing-assets/validation";
import type { UserRole } from "@/lib/users/permissions";

function form(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

function user(id: string, role: UserRole, secondaryRole: UserRole | null = null) {
  return { id, role, secondary_role: secondaryRole };
}

const validFileInput = {
  title: "Farmer product leaflet",
  description: null,
  audience: "Farmers",
  sector: "Agriculture",
  crop: "Tomato",
  crops: ["Tomato"],
  language: "English",
  asset_type: "Leaflet",
  delivery_format: "Digital",
  content_source: "file" as const,
  youtube_url: null,
  external_url: null,
  source_marketing_request_id: null,
  change_note: null
};

describe("Marketing Library classification", () => {
  it("drops crop values unless Agriculture is selected", () => {
    const input = marketingAssetInputFromForm(
      form({
        audience: "Farmers",
        sector: "Dairy",
        crops: "Tomato",
        language: "English"
      })
    );

    expect(input.crop).toBeNull();
    expect(input.crops).toEqual([]);
  });

  it("retains multiple valid crops for Agriculture", () => {
    const input = marketingAssetInputFromForm(
      form({ sector: "Agriculture", crops: "Tomato" })
    );
    const formData = form({ sector: "Agriculture", crops: "Tomato" });
    formData.append("crops", "Garlic");
    const multiCropInput = marketingAssetInputFromForm(formData);

    expect(input.crop).toBe("Tomato");
    expect(multiCropInput.crop).toBe("Tomato");
    expect(multiCropInput.crops).toEqual(["Tomato", "Garlic"]);
  });

  it("requires files for documents and YouTube links for videos", () => {
    expect(validateMarketingAssetInput(validFileInput, false)).toMatch(
      /upload/i
    );
    expect(validateMarketingAssetInput(validFileInput, true)).toBeNull();
    expect(
      validateMarketingAssetInput(
        {
          ...validFileInput,
          asset_type: "Video",
          youtube_url: "https://youtu.be/dQw4w9WgXcQ"
        },
        false
      )
    ).toBeNull();
  });

  it("accepts HTTPS material links as a file alternative", () => {
    expect(
      validateMarketingAssetInput(
        {
          ...validFileInput,
          content_source: "link",
          external_url: "https://example.com/material.pdf"
        },
        false
      )
    ).toBeNull();
  });

  it("rejects non-HTTPS material links", () => {
    expect(
      validateMarketingAssetInput(
        {
          ...validFileInput,
          content_source: "link",
          external_url: "http://example.com/material.pdf"
        },
        false
      )
    ).toMatch(/https/i);
  });
});

describe("Marketing Library YouTube links", () => {
  it("accepts standard, short, and Shorts URLs", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(youtubeVideoId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
  });

  it("rejects lookalike hosts and non-HTTPS links", () => {
    expect(youtubeVideoId("https://youtube.com.example.test/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeVideoId("http://youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });
});

describe("Marketing Library review separation", () => {
  const asset = {
    created_by_user_id: "uploader",
    review_required_role: "Marketing Head"
  };

  it("routes Designer uploads to Marketing Head and lets Marketing Head self-publish", () => {
    expect(marketingUploaderRole(user("one", "Marketing Head"))).toBe(
      "Marketing Head"
    );
    expect(reviewRoleForUploader("Marketing Head")).toBeNull();
    expect(reviewRoleForUploader("Designer")).toBe("Marketing Head");
    expect(uploaderCanSelfPublish("Marketing Head")).toBe(true);
    expect(uploaderCanSelfPublish("Designer")).toBe(false);
  });

  it("allows the counterpart and Admin, but not the uploader, to review", () => {
    expect(
      canReviewMarketingAsset(user("marketing", "Marketing Head"), asset)
    ).toBe(true);
    expect(
      canReviewMarketingAsset(user("uploader", "Marketing Head"), asset)
    ).toBe(false);
    expect(canReviewMarketingAsset(user("admin", "Admin"), asset)).toBe(true);
  });

  it("lets Marketing Head and Admin edit published asset details", () => {
    const publishedAsset = {
      created_by_user_id: "designer",
      status: "Published"
    };

    expect(
      canEditMarketingAssetDetails(user("marketing", "Marketing Head"), publishedAsset)
    ).toBe(true);
    expect(canEditMarketingAssetDetails(user("admin", "Admin"), publishedAsset)).toBe(true);
    expect(canEditMarketingAssetDetails(user("designer", "Designer"), publishedAsset)).toBe(false);
  });
});
