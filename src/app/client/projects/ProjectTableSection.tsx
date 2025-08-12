"use client";
import React, { useState } from "react";
import { ArrowDown } from "@/icons";
import { ChevronDown } from "@/icons";
import { User } from "@/icons";
import { useRouter } from "next/navigation";

type Activity = { id: string; time: string; actor: string; action: string; tag?: string };

export type Project = {
  id: string;
  projectName: string;
  artistName: string | null;
  genre: string | null;
  stage: string | null;
  progressStatus: string;
  latestUpdate: string | null;
  assignedPIC: string;
  budget?: string;
  assignedEngineer?: string;
  assignedANR?: string;
  coverUrl?: string;
  description?: string | null;
  progress?: number | null;
  activities?: Activity[];
};

const tableHeaders = [
  { key: "author", label: "Author", hasSort: true },
  { key: "genre", label: "Genre", hasSort: false },
  { key: "stage", label: "Stage", hasSort: false },
  { key: "progressStatus", label: "Progress Status", hasSort: false },
  { key: "latestUpdate", label: "Latest Update", hasSort: false },
  { key: "assignedPIC", label: "Assigned PIC", hasSort: false },
];

type Props = {
  rows: Project[];                 // 🔹 data sudah dipersiapkan parent
  emptyText?: string;              // opsional
  onOpenProject?: (id: string) => void; // ⬅️ baru
};

export const ProjectTableSection = ({
  rows,
  emptyText = "No projects found.", onOpenProject
}: Props): React.JSX.Element => {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [leftSlide, setLeftSlide] = useState<Record<string, 0 | 1>>({}); // 0=overview, 1=activity

  // ---------- selection ----------
  const handleRowSelection = (id: string) => {
    const next = new Set(selectedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRows(next);
    setSelectAll(next.size === rows.length && rows.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) setSelectedRows(new Set());
    else setSelectedRows(new Set(rows.map((p) => p.id)));
    setSelectAll(!selectAll);
  };

  // ---------- expand ----------
  const toggleRowExpand = (id: string) => {
    const next = new Set(expandedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedRows(next);
  };

  const goSlide = (id: string, idx: 0 | 1) => setLeftSlide((s) => ({ ...s, [id]: idx }));

    const ProgressBar = ({ value = 0 }: { value?: number | null }) => {
  const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-[width] duration-500 ease-in-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
  // ---------- empty placeholder (tanpa spinner) ----------
  if (rows.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200 p-10 flex items-center justify-center">
        <span className="text-base font-medium text-gray-500">{emptyText}</span>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden" role="table">
      <thead>
        <tr className="h-12 bg-gray-100 text-gray-700">
          <th className="w-12 p-3 text-center border-b border-gray-200">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="w-5 h-5 border-gray-300 border rounded-sm appearance-none checked:bg-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Select all rows"
            />
          </th>

          {tableHeaders.map((header) => (
            <th key={header.key} className="px-4 py-3 text-left border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{header.label}</span>
                {header.hasSort && <ArrowDown className="text-gray-600" />}
              </div>
            </th>
          ))}

          <th className="w-10 p-3 text-center border-b border-gray-200" />
        </tr>
      </thead>

      <tbody>
        {rows.map((project) => (
          <React.Fragment key={project.id}>
            <tr
              className="group hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleRowExpand(project.id)}
              aria-expanded={expandedRows.has(project.id)}
            >
              <td className="p-3 text-center border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedRows.has(project.id)}
                  onChange={() => handleRowSelection(project.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 border-gray-300 border rounded-sm appearance-none checked:bg-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label={`Select row ${project.projectName}`}
                />
              </td>

              <td className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{project.projectName}</div>
                    <div className="text-sm text-gray-500 truncate">{project.artistName ?? "-"}</div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-gray-700 border-b border-gray-200">{project.genre ?? "-"}</td>
              <td className="px-4 py-3 text-gray-700 border-b border-gray-200">{project.stage ?? "-"}</td>
              <td className="px-4 py-3 text-gray-700 border-b border-gray-200">{project.progressStatus}</td>
              <td className="px-4 py-3 text-gray-700 border-b border-gray-200">
                {project.latestUpdate
                  ? new Date(project.latestUpdate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                  : "-"}
              </td>

              <td className="px-4 py-3 border-b border-gray-200" onClick={(e)=>e.stopPropagation()}>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                  {project.assignedPIC}
                </div>
              </td>

              <td className="p-3 text-center border-b border-gray-200">
                <button
                  className={`w-6 h-6 text-gray-600 transition-transform ${expandedRows.has(project.id) ? "rotate-180" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleRowExpand(project.id); }}
                  aria-label="Toggle details"
                >
                  <ChevronDown />
                </button>
              </td>
            </tr>

            {/* Expanded Row */}
            <tr
              className={`transition-[opacity,transform] ease-in-out duration-300 bg-gray-50 ${
                expandedRows.has(project.id) ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95"
              }`}
              style={{ visibility: expandedRows.has(project.id) ? "visible" : "collapse" }}
            >
              <td colSpan={8} className="p-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* LEFT: Overview / Activity */}
                  <div className="relative rounded-md border border-gray-200 bg-white overflow-hidden">
                    {/* Controls */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/80 backdrop-blur px-1.5 py-1 rounded-md shadow-sm">
                      <button
                        onClick={() => goSlide(project.id, 0)}
                        className={`w-2 h-2 rounded-full ${ (leftSlide[project.id] ?? 0) === 0 ? "bg-blue-600" : "bg-gray-300"}`}
                        aria-label="Overview"
                      />
                      <button
                        onClick={() => goSlide(project.id, 1)}
                        className={`w-2 h-2 rounded-full ${ (leftSlide[project.id] ?? 0) === 1 ? "bg-blue-600" : "bg-gray-300"}`}
                        aria-label="Activity"
                      />
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <button
                        onClick={() => goSlide(project.id, (leftSlide[project.id] ?? 0) === 0 ? 1 : 0)}
                        className="text-xs px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-50"
                        aria-label="Toggle slide"
                      >
                        ❮❯
                      </button>
                    </div>

                    {/* Slider track */}
                    <div className="w-full overflow-hidden">
                      <div
                        className="flex w-[200%] transition-transform duration-300"
                        style={{ transform: `translateX(-${((leftSlide[project.id] ?? 0) * 50)}%)` }}
                      >
                        {/* Slide 1: Overview */}
                        <section className="w-1/2 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                              <div className="w-full h-full grid place-items-center text-gray-400 text-sm">No Cover</div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-800">{project.projectName}</div>
                              <div className="text-sm text-gray-500">
                                {(project.artistName ?? "-")} • {(project.genre ?? "-")}
                              </div>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Overall Progress</span>
                                <span>{(project.progress ?? 0)}%</span>
                            </div>
                            <ProgressBar value={project.progress} />
                            </div>

                          {/* Small badges */}
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">Stage: {project.stage ?? "-"}</span>
                            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">Status: {project.progressStatus}</span>
                          </div>
                        </section>

                        {/* Slide 2: Activity / Timeline */}
                        <section className="w-1/2 p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Recent Activity</div>
                          <div className="max-h-44 overflow-auto pr-1 scroll-smooth">
                            <ul className="relative pl-4">
                              <span className="absolute left-1 top-0 bottom-0 w-px bg-gray-200" aria-hidden />
                              <li className="text-sm text-gray-500">No activity yet.</li>
                            </ul>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: details + CTA */}
                  <div className="rounded-md border border-gray-200 bg-white p-4 flex flex-col">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                      <div className="font-medium text-gray-500">Budget:</div>
                      <div className="text-gray-800">{project.budget ?? "-"}</div>

                      <div className="font-medium text-gray-500">Status:</div>
                      <div className="text-gray-800">{project.progressStatus}</div>

                      <div className="font-medium text-gray-500">Stage:</div>
                      <div className="text-gray-800">{project.stage ?? "-"}</div>

                      <div className="font-medium text-gray-500">Assigned PIC:</div>
                      <div className="text-gray-800">{project.assignedPIC}</div>

                      <div className="font-medium text-gray-500">Assigned Engineer:</div>
                      <div className="text-gray-800">{project.assignedEngineer ?? "-"}</div>

                      <div className="font-medium text-gray-500">Assigned A&R:</div>
                      <div className="text-gray-800">{project.assignedANR ?? "-"}</div>

                      <div className="font-medium text-gray-500">Latest Update:</div>
                      <div className="text-gray-800">
                        {project.latestUpdate ? new Date(project.latestUpdate).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>

                    <div className="mt-auto flex justify-end pt-4">
                      <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProject?.(project.id);
                        }}
                      >
                        Open Project
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};
