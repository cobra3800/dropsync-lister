export type CreateLocationInput = {
  storeId: string;

  locationKey: string;

  name: string;

  address: {
    addressLine1: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
  };
};