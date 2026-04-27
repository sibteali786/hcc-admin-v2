"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Refresh } from "@mui/icons-material";
import useAuthStore from "@/store/store";
import { apiPath } from "@/utils/routes";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import NewContactListDrawer from "../drawers/newContactListDrawer";
import SendBulkEmailViaGmail from "../drawers/bulkEmialDrawer";

export default function ContactListsTable() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.user?._id;

  const [contactLists, setContactLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(null);

  const fetchLists = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await axios.get(`${apiPath.prodPath3}/api/contact-lists/${userId}`);
      const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setContactLists(rows);
    } catch (error) {
      setContactLists([]);
      Swal.fire("Error", "Failed to load contact lists", "error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return (
    <div className="mt-5 w-full">
      <div className="flex flex-col gap-2 border-2 border-[#452C95] shadow-lg h-[100%] rounded-[12px] p-4 bg-[#231C46] w-[100%]">
        <div className="flex flex-row items-center gap-2">
          <Button
            className="bg-[#452C95] w-1/3 text-white hover:bg-[#452C95] hover:opacity-80"
            onClick={fetchLists}
          >
            <Refresh className="mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-[#B797FF] w-1/3 text-black hover:bg-[#B797FF] hover:opacity-80"
            onClick={() => setOpenCreateDrawer(true)}
          >
            + New Contact List
          </Button>
        </div>

        {loading ? (
          <p className="text-[#E1C9FF] text-sm mt-4">Loading contact lists...</p>
        ) : contactLists.length === 0 ? (
          <p className="text-[#E1C9FF] text-sm mt-4">No contact lists found.</p>
        ) : (
          <Table className="bg-[#231C46] rounded-[12px] font-satoshi mt-2">
            <TableCaption className="text-[#E1C9FF]">Saved contact lists</TableCaption>
            <TableHeader>
              <TableRow className="w-fit h-[58px] font-satoshi text-lg text-[#E1C9FF]">
                <TableHead className="text-[#E1C9FF]">List Name</TableHead>
                <TableHead className="text-[#E1C9FF]">Description</TableHead>
                <TableHead className="text-[#E1C9FF]">Members</TableHead>
                <TableHead className="text-[#E1C9FF]">Created</TableHead>
                <TableHead className="text-[#E1C9FF]">Bulk Send</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactLists.map((list) => (
                <TableRow
                  className="w-fit h-[72px] bg-[#2D245B] border-[1px] border-[#452C95]"
                  key={list._id}
                >
                  <TableCell className="font-satoshi font-medium text-white">
                    {list.name}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-[#E1C9FF]">
                    {list.description || "-"}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-white">
                    {Array.isArray(list.members) ? list.members.length : 0}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-[#E1C9FF]">
                    {list.createdAt ? moment(list.createdAt).format("MMM DD, YYYY") : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      className="bg-[#452C95] text-white hover:opacity-80 text-xs px-3 py-1"
                      onClick={() => {
                        setSelectedList(list);
                        setBulkDrawerOpen(true);
                      }}
                    >
                      Send Bulk
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <NewContactListDrawer
        open={openCreateDrawer}
        handleClose={() => setOpenCreateDrawer(false)}
        refreshData={fetchLists}
      />
      {bulkDrawerOpen && selectedList && (
        <SendBulkEmailViaGmail
          open={bulkDrawerOpen}
          handleClose={() => {
            setBulkDrawerOpen(false);
            setSelectedList(null);
          }}
          emails={[]}
          newClients={[]}
          preselectedListId={selectedList._id}
        />
      )}
    </div>
  );
}
