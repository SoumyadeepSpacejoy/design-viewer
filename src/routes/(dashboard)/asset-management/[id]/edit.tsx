import { useParams } from "@solidjs/router";
import CreateAssetForm from "~/components/CreateAssetForm";

export default function EditAssetPage() {
  const params = useParams<{ id: string }>();
  return <CreateAssetForm assetId={params.id} />;
}
