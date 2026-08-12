import CreateAssetForm from "@/components/CreateAssetForm";

export const runtime = "edge";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CreateAssetForm assetId={id} />;
}
