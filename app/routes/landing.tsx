import { json, type MetaFunction, type LinksFunction } from '@remix-run/cloudflare';
import { LandingPage } from '~/components/landing/LandingPage';

export const meta: MetaFunction = () => {
  return [
    { title: 'Climate Seal - ESG智能碳顧問平台' },
    { name: 'description', content: '利用尖端AI碳顧問和可信碳因子數據，幫助企業應對氣候與ESG挑戰' }
  ];
};

export const loader = () => json({});

/**
 * ESG AI Carbon Advisor Landing Page
 */
export default function Landing() {
  return <LandingPage />;
} 