import { validatePortalToken } from "@/lib/portal-auth";
import { CustomerDashboard } from "@/components/portal/CustomerDashboard";
import { ShieldX } from "lucide-react";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await validatePortalToken(token);

  if (!result.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="w-16 h-16 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            접근할 수 없습니다
          </h1>
          <p className="text-gray-500 mb-4">
            유효하지 않거나 만료된 링크입니다.
          </p>
          <p className="text-sm text-gray-400">
            시공사에 문의하여 새로운 포탈 링크를 요청해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CustomerDashboard
      token={token}
      customerName={result.customer.name}
      siteName={result.site.name}
      siteAddress={result.site.address || ""}
    />
  );
}
