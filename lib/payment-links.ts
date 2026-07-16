export type PaymentLink = {
  label: string;
  discount: number;
  amount: number;
  url: string;
};

export type ProductPaymentLinks = {
  product: string;
  regularPrice: number;
  links: PaymentLink[];
};

export const productPaymentLinks: ProductPaymentLinks[] = [
  {
    product: "Dihanga",
    regularPrice: 159850,
    links: [
      {
        label: "Regular price",
        discount: 0,
        amount: 159850,
        url: "https://rzp.io/rzp/jwfd1dihanga"
      }
    ]
  },
  {
    product: "Jahnavi",
    regularPrice: 63950,
    links: [
      {
        label: "Regular price",
        discount: 0,
        amount: 63950,
        url: "https://rzp.io/rzp/jwfd1jahnavi"
      },
      {
        label: "5% discount",
        discount: 5,
        amount: 60752,
        url: "https://rzp.io/rzp/jwfd2jahnavi"
      },
      {
        label: "10% discount",
        discount: 10,
        amount: 57555,
        url: "https://rzp.io/rzp/jwfd3jahnavi"
      },
      {
        label: "15% discount",
        discount: 15,
        amount: 54357,
        url: "https://rzp.io/rzp/jwfd4jahnavi"
      }
    ]
  },
  {
    product: "Vipasa",
    regularPrice: 26950,
    links: [
      {
        label: "Regular price",
        discount: 0,
        amount: 26950,
        url: "https://rzp.io/rzp/jwfd1vipasa"
      },
      {
        label: "5% discount",
        discount: 5,
        amount: 25602,
        url: "https://rzp.io/rzp/jwfd2vipasa"
      },
      {
        label: "10% discount",
        discount: 10,
        amount: 24255,
        url: "https://rzp.io/rzp/jwfd3vipasa"
      },
      {
        label: "15% discount",
        discount: 15,
        amount: 22907,
        url: "https://rzp.io/rzp/jwfd4vipasa"
      }
    ]
  }
];
