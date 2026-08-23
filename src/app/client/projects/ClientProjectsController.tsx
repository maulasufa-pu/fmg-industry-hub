"use client";

import { useRouter, useSearchParams } from "next/navigation";
import ProjectList, {
  type TabKey as ClientTabKey,
  type ProjectRow as ClientProjectRow,
  type PicOption,
  type StageOption,
  type StatusOption,
} from "@/app/ui/panel/projects/project_list";

type Props = {
  mode?: "client";
  basePath: string; 
  rows: ClientProjectRow[];
  counts: Record<ClientTabKey, number>;
  activeTab: ClientTabKey;
  search: string;
  filterPIC: PicOption;
  filterStage: StageOption;
  filterStatus: StatusOption;
  filterOptions: {
    picOptions: PicOption[];
    stageOptions: StageOption[];
    statusOptions: StatusOption[];
  };
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
};

export default function ClientProjectsController(props: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const push = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === "any") params.delete(k);
      else params.set(k, String(v));
    });
    router.push(`${props.basePath}?${params.toString()}`);
  };

  return (
    <ProjectList
      rows={props.rows}
      counts={props.counts}
      activeTab={props.activeTab}
      onTabChange={(tab) => {
        push({ tab, page: 1 });
      }}
      search={props.search}
      onSearchChange={(q) => {
        push({ q, page: 1 });
      }}
      filterPIC={props.filterPIC}
      filterStage={props.filterStage}
      filterStatus={props.filterStatus}
      onFilterPIC={(v) => push({ pic: v })}
      onFilterStage={(v) => push({ stage: v, page: 1 })}
      onFilterStatus={(v) => push({ status: v, page: 1 })}
      filterOptions={props.filterOptions}
      loading={props.loading}
      totalCount={props.totalCount}
      currentPage={props.currentPage}
      pageSize={props.pageSize}
      onPageChange={(p) => push({ page: p })}
      onOpen={(project_id) => {
        router.push(`/client/projects/${project_id}`);
      }}
      onBulkAssignPIC={async (ids, pic) => {
        //console.log("Bulk assign PIC (client scope):", ids, pic);
      }}
      onBulkMarkFinished={async (ids) => {
        //console.log("Bulk mark finished (client scope):", ids);
      }}
    />
  );
}
