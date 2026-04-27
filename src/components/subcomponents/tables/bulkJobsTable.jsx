"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import moment from "moment";
import Swal from "sweetalert2";
import useAuthStore from "@/store/store";
import { apiPath } from "@/utils/routes";
import { Button } from "@/components/ui/button";
import { Refresh } from "@mui/icons-material";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_COLORS = {
  queued: "#B797FF",
  processing: "#7F56D9",
  completed: "#4ADE80",
  failed: "#F87171",
};

export default function BulkJobsTable() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.user?._id;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollingActive = useRef(true);

  const fetchJobs = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await axios.get(`${apiPath.prodPath3}/api/bulkEmail/getBulkEmailJobs/${userId}`);
      const rows = Array.isArray(res.data?.jobs) ? res.data.jobs : [];
      setJobs(rows);
    } catch (error) {
      pollingActive.current = false;
      setJobs([]);
      Swal.fire("Error", "Failed to load bulk jobs", "error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleManualRefresh = async () => {
    pollingActive.current = true;
    await fetchJobs();
  };

  useEffect(() => {
    pollingActive.current = true;
    fetchJobs();

    const intervalId = setInterval(() => {
      if (!pollingActive.current) {
        clearInterval(intervalId);
        return;
      }
      fetchJobs();
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchJobs]);

  const kpis = useMemo(() => {
    const totalJobs = jobs.length;
    const completedCount = jobs.filter((job) => job?.status === "completed").length;
    const failedCount = jobs.filter((job) => job?.status === "failed").length;
    return {
      totalJobs,
      completedCount,
      failedCount,
    };
  }, [jobs]);

  return (
    <div className="mt-5 w-full">
      <div className="flex flex-col gap-2 border-2 border-[#452C95] shadow-lg rounded-[12px] p-4 bg-[#231C46] w-full">
        <div className="flex flex-row items-center gap-2">
          <Button
            className="bg-[#452C95] w-1/3 text-white hover:bg-[#452C95] hover:opacity-80"
            onClick={handleManualRefresh}
          >
            <Refresh className="mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <div className="rounded-[12px] border border-[#452C95] bg-[#2D245B] p-4">
            <p className="text-sm text-[#E1C9FF]">Total Jobs</p>
            <p className="text-2xl font-bold text-white">{kpis.totalJobs}</p>
          </div>
          <div className="rounded-[12px] border border-[#452C95] bg-[#2D245B] p-4">
            <p className="text-sm text-[#E1C9FF]">Completed</p>
            <p className="text-2xl font-bold text-[#4ADE80]">{kpis.completedCount}</p>
          </div>
          <div className="rounded-[12px] border border-[#452C95] bg-[#2D245B] p-4">
            <p className="text-sm text-[#E1C9FF]">Failed</p>
            <p className="text-2xl font-bold text-[#F87171]">{kpis.failedCount}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-[#E1C9FF] text-sm mt-4">Loading bulk jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-[#E1C9FF] text-sm mt-4">No bulk jobs found.</p>
        ) : (
          <Table className="bg-[#231C46] rounded-[12px] font-satoshi mt-2">
            <TableCaption className="text-[#E1C9FF]">Bulk email jobs</TableCaption>
            <TableHeader>
              <TableRow className="w-fit h-[58px] font-satoshi text-lg text-[#E1C9FF]">
                <TableHead className="text-[#E1C9FF]">Status</TableHead>
                <TableHead className="text-[#E1C9FF]">Subject</TableHead>
                <TableHead className="text-[#E1C9FF]">Service</TableHead>
                <TableHead className="text-[#E1C9FF]">Progress</TableHead>
                <TableHead className="text-[#E1C9FF]">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const status = String(job?.status || "queued").toLowerCase();
                const statusColor = STATUS_COLORS[status] || "#B797FF";
                const sentCount = Number(job?.sentCount || 0);
                const totalRecipients = Number(job?.totalRecipients || 0);
                const service = String(job?.service || "gmail").toLowerCase();
                const serviceLabel = service === "sendgrid" ? "SendGrid" : "Gmail";

                return (
                  <TableRow
                    key={job?._id || job?.jobId}
                    className="w-fit h-[72px] bg-[#2D245B] border-[1px] border-[#452C95]"
                  >
                    <TableCell className="font-satoshi font-medium text-white">
                      <span
                        className="inline-block rounded-full px-2 py-1 text-xs font-semibold text-black"
                        style={{ backgroundColor: statusColor }}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell className="font-satoshi font-medium text-white">
                      {job?.subject || "-"}
                    </TableCell>
                    <TableCell className="font-satoshi font-medium text-[#E1C9FF]">
                      {serviceLabel}
                    </TableCell>
                    <TableCell className="font-satoshi font-medium text-white">
                      {sentCount}/{totalRecipients}
                    </TableCell>
                    <TableCell className="font-satoshi font-medium text-[#E1C9FF]">
                      {job?.createdAt ? moment(job.createdAt).format("MMM DD, YYYY hh:mm A") : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
