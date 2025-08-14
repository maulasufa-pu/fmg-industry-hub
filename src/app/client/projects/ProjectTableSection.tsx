// E:\FMGIH\fmg-industry-hub\src\app\client\projects\ProjectTableSection.tsx
"use client";

import React, { useState } from "react";
import { ArrowDown, ChevronDown, User } from "@/icons";

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

const tableHeaders: Array<{ key: keyof Project | "author"; label: string; hasSort: boolean }> = [
  { key: "author", label: "Author", hasSort: true },
  { key: "genre", label: "Genre", hasSort: false },
  { key: "stage", label: "Stage", hasSort: false },
  { key: "progressStatus", label: "Progress Status", hasSort: false },
  { key: "latestUpdate", label: "Latest Update", hasSort: false },
  { key: "assignedPIC", label: "Assigned PIC", hasSort: false },
];

type Props = {
  rows: Project[];
  emptyText?: string;
  onOpenProject?: (id: string) => void;
};

export const ProjectTableSection = ({
  rows,
  emptyText = "No projects found.",
  onOpenProject,
}: Props): React.JSX.Element => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [leftSlide, setLeftSlide] = useState<Record<string, 0 | 1>>({}); // 0=overview, 1=activity

  // ---------- selection ----------
  const handleRowSelection = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
    setSelectAll(next.size === rows.length && rows.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((p) => p.id)));
    }
    setSelectAll(!selectAll);
  };

  // ---------- expand ----------
  const toggleRowExpand = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const goSlide = (id: string, idx: 0 | 1) => setLeftSlide((s) => ({ ...s, [id]: idx }));

  const ProgressBar = ({ value = 0 }: { value?: number | null }) => {
    const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
    return (
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-[width] duration-500 ease-in-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  };

  // ---------- empty ----------
  if (rows.length === 0) {
    return (
      <div className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white p-10 shadow-lg">
        <span className="text-base font-medium text-gray-500">{emptyText}</span>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse overflow-hidden rounded-lg bg-white shadow-lg" role="table">
      <thead>
        <tr className="h-12 bg-gray-100 text-gray-700">
          <th className="w-12 border-b border-gray-200 p-3 text-center">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="h-5 w-5 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-blue-600 focus:ring-2 focus:ring-blue-500"
              aria-label="Select all rows"
            />
          </th>

          {tableHeaders.map((header) => (
            <th key={header.key as string} className="border-b border-gray-200 px-4 py-3 text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{header.label}</span>
                {header.hasSort && <ArrowDown className="text-gray-600" />}
              </div>
            </th>
          ))}

          <th className="w-10 border-b border-gray-200 p-3 text-center" />
        </tr>
      </thead>

      <tbody>
        {rows.map((project) => {
          const isExpanded = expandedRows.has(project.id);
          return (
            <React.Fragment key={project.id}>
              <tr
                className="group cursor-pointer hover:bg-gray-50"
                onClick={() => toggleRowExpand(project.id)}
                onDoubleClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                  e.stopPropagation();
                  onOpenProject?.(project.id);
                }}
                aria-expanded={isExpanded}
              >
                <td className="border-b border-gray-200 p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(project.id)}
                    onChange={() => handleRowSelection(project.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 cursor-pointer appearance-none rounded-sm border border-gray-300 checked:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                    aria-label={`Select row ${project.projectName}`}
                  />
                </td>

                {/* Author */}
                <td className="border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gray-200">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-gray-800">{project.projectName}</div>
                      <div className="truncate text-sm text-gray-500">{project.artistName ?? "-"}</div>
                    </div>
                  </div>
                </td>

                <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{project.genre ?? "-"}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{project.stage ?? "-"}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-gray-700">{project.progressStatus}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                  {project.latestUpdate
                    ? new Date(project.latestUpdate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </td>

                <td
                  className="border-b border-gray-200 px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                    {project.assignedPIC}
                  </div>
                </td>

                <td className="border-b border-gray-200 p-3 text-center">
                  <button
                    className={`h-6 w-6 text-gray-600 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowExpand(project.id);
                    }}
                    aria-label="Toggle details"
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown />
                  </button>
                </td>
              </tr>

              {/* Expanded Row */}
              <tr
                className={`bg-gray-50 transition-[opacity,transform] duration-300 ease-in-out ${
                  isExpanded ? "scale-y-100 opacity-100" : "scale-y-95 opacity-0"
                }`}
                style={{ visibility: isExpanded ? "visible" : "collapse" }}
              >
                <td colSpan={8} className="p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* LEFT: Overview / Activity */}
                    <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white">
                      {/* Controls */}
                      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-white/80 px-1.5 py-1 shadow-sm backdrop-blur">
                        <button
                          onClick={() => goSlide(project.id, 0)}
                          className={`h-2 w-2 rounded-full ${
                            (leftSlide[project.id] ?? 0) === 0 ? "bg-blue-600" : "bg-gray-300"
                          }`}
                          aria-label="Overview"
                        />
                        <button
                          onClick={() => goSlide(project.id, 1)}
                          className={`h-2 w-2 rounded-full ${
                            (leftSlide[project.id] ?? 0) === 1 ? "bg-blue-600" : "bg-gray-300"
                          }`}
                          aria-label="Activity"
                        />
                        <div className="mx-1 h-4 w-px bg-gray-200" />
                        <button
                          onClick={() => goSlide(project.id, (leftSlide[project.id] ?? 0) === 0 ? 1 : 0)}
                          className="rounded border border-gray-200 px-2 py-0.5 text-xs hover:bg-gray-50"
                          aria-label="Toggle slide"
                        >
                          ❮❯
                        </button>
                      </div>

                      {/* Slider track */}
                      <div className="w-full overflow-hidden">
                        <div
                          className="flex w-[200%] transition-transform duration-300"
                          style={{ transform: `translateX(-${(leftSlide[project.id] ?? 0) * 50}%)` }}
                        >
                          {/* Slide 1: Overview */}
                          <section className="w-1/2 p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                <div className="grid h-full w-full place-items-center text-sm text-gray-400">
                                  No Cover
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-800">{project.projectName}</div>
                                <div className="text-sm text-gray-500">
                                  {project.artistName ?? "-"} • {project.genre ?? "-"}
                                </div>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="mt-4">
                              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                                <span>Overall Progress</span>
                                <span>{project.progress ?? 0}%</span>
                              </div>
                              <ProgressBar value={project.progress} />
                            </div>

                            {/* Small badges */}
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                                Stage: {project.stage ?? "-"}
                              </span>
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                                Status: {project.progressStatus}
                              </span>
                            </div>
                          </section>

                          {/* Slide 2: Activity / Timeline */}
                          <section className="w-1/2 p-4">
                            <div className="mb-2 text-sm font-medium text-gray-700">Recent Activity</div>
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
                    <div className="flex flex-col rounded-md border border-gray-200 bg-white p-4">
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
                          className="rounded-md bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
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
          );
        })}
      </tbody>
    </table>
  );
};
