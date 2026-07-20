import { describe, expect, it } from "vitest";
import {
  canReviewMarketingAsset,
  marketingUploaderRole,
  reviewRoleForUploader
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
  language: "English",
  asset_type: "Leaflet",
  delivery_format: "Digital",
  youtube_url: null,
  source_marketing_request_id: null,
  change_note: null
};

describe("Marketing Library classification", () => {
  it("drops crop values unless Agriculture is selected", () => {
    const input = marketingAssetInputFromForm(
      form({
        audience: "Farmers",
        sector: "Dairy",
        crop: "Tomato",
        language: "English"
      })
    );

    expect(input.crop).toBeNull();
  });

  it("retains a valid crop for Agriculture", () => {
    const input = marketingAssetInputFromForm(
      form({ sector: "Agriculture", crop: "Tomato" })
    );

    expect(input.crop).toBe("Tomato");
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

  it("accepts Insert Link as a delivery format", () => {
    expect(
      validateMarketingAssetInput(
        { ...validFileInput, delivery_format: "Insert Link" },
        true
      )
    ).toBeNull();
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
    review_required_role: "Designer"
  };

  it("routes Marketing Head and Designer uploads to each other", () => {
    expect(marketingUploaderRole(user("one", "Marketing Head"))).toBe(
      "Marketing Head"
    );
    expect(reviewRoleForUploader("Marketing Head")).toBe("Designer");
    expect(reviewRoleForUploader("Designer")).toBe("Marketing Head");
  });

  it("allows the counterpart and Admin, but not the uploader, to review", () => {
    expect(canReviewMarketingAsset(user("designer", "Designer"), asset)).toBe(
      true
    );
    expect(canReviewMarketingAsset(user("uploader", "Designer"), asset)).toBe(
      false
    );
    expect(canReviewMarketingAsset(user("admin", "Admin"), asset)).toBe(true);
  });
});
