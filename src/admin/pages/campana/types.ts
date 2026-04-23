// Concrete form data type used by Step components and NuevaCampana state.
// More specific than the hook's CampaignFormData (which has all-optional
// fields + index signature for draft serialisation).
export interface CampaignFormData {
  business_profile_id: string | undefined;
  company_name: string;
  offer: string;
  ideal_client: string;
  differentiator: string;
  price_range: string;
  sales_method: string;
  name: string;
  objective: string;
  daily_budget: number;
  audience_age_min: number | '';
  audience_age_max: number | '';
  locations: string[];
  interests: string[];
  gender: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
}

export type TagField = 'locations' | 'interests';

