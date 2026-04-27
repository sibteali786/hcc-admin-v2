import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/utils/routes";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { SkeletonCard } from "@/components/reusable/skeleton-card";
import useAuthStore from "@/store/store";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import "./style.scss";
import AddEmailCredentials from "../subcomponents/drawers/addEmailCredentials";
import InboxTable from "../subcomponents/tables/inboxTable";
import MailingTable from "../subcomponents/tables/mailingTable";
import ContactListsTable from "../subcomponents/tables/contactListsTable";
import BulkJobsTable from "../subcomponents/tables/bulkJobsTable";
import TemplatesTable from "../subcomponents/tables/templatesTable";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "800"],
  style: ["italic", "normal"],
  subsets: ["latin"],
});

function MailingComp() {
  const [activeTab, setActiveTab] = useState("0");
  const [bulkSubTab, setBulkSubTab] = useState("0");
  const [templatesSubTab, setTemplatesSubTab] = useState("0");

  const [picklistData, setPicklistData] = useState([]);
  const [loader, setLoader] = useState(false);
  const [userTypeModal, setUserTypeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("");
  const [filterOpt, setFilterOpt] = useState([]);

  const user = useAuthStore((state) => state.user);
  const usernameId = user?.user?._id || "";

  const showSearchBar = activeTab === "0" || activeTab === "1";
  const showGoogleButton = activeTab === "0" || activeTab === "1";

  const filterOptions = useCallback(() => {
    setFilterOpt([]);
  }, []);

  const fetchData = useCallback(async () => {
    if (activeTab === "0" && !usernameId) return;
    if (activeTab !== "0" && activeTab !== "1") return;

    setLoader(true);
    let url = "";

    try {
      if (activeTab === "0") {
        url = `${apiPath.prodPath}/api/appGmail/listEmails/${usernameId}`;
      } else {
        url = `${apiPath.prodPath}/api/clients/allNewLeads?page=1&limit=8`;
      }

      const res = await axios.get(url);
      setPicklistData(res.data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        text: "Something went wrong with the data fetching",
      });
    } finally {
      setLoader(false);
    }
  }, [activeTab, usernameId]);

  const handleSearch = async () => {
    if (!filterBy || !searchTerm.trim()) {
      Swal.fire({
        icon: "warning",
        text: "Please select a filter and enter a search term.",
      });
      return;
    }

    if (activeTab !== "0" && activeTab !== "1") return;

    setLoader(true);
    let url = "";

    try {
      if (activeTab === "0") {
        url = `${apiPath.prodPath}/api/gmail/inbox?${filterBy}=${searchTerm}`;
      } else {
        url = `${apiPath.prodPath}/api/clients/allNewLeads?${filterBy}=${searchTerm}`;
      }

      const res = await axios.get(url);
      setPicklistData(res.data);
    } catch (err) {
      Swal.fire({
        icon: "error",
        text: "Something went wrong with the data fetching",
      });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    filterOptions();
  }, [filterOptions, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAuth = () => {
    window.location.assign("https://api-hccbackendcrm.com/auth/google");
  };

  const tabTitleMap = {
    0: "Inbox",
    1: "Clients",
    2: "Bulk Email",
    3: "Templates",
  };

  return (
    <main className={`${poppins.className} flex flex-col`}>
      <Box sx={{ width: "100%", typography: "body1" }}>
        <TabContext value={activeTab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", color: "#fff" }}>
            <TabList onChange={(event, newValue) => setActiveTab(newValue)} aria-label="mailing main tabs">
              <Tab label="Inbox" value="0" />
              <Tab label="Clients" value="1" />
              <Tab label="Bulk Email" value="2" />
              <Tab label="Templates" value="3" />
            </TabList>
          </Box>

          <div className="flex w-full flex-row flex-wrap justify-between mt-4">
            <div className="w-full flex flex-row gap-2 mb-[24px] h-[34px]">
              <h1 className="font-satoshi font-semibold text-2xl ml-[20px]">{tabTitleMap[activeTab]}</h1>
            </div>

            {showSearchBar && (
              <div className="flex flex-row gap-4 items-start border-none w-full">
                <div className="flex flex-row gap-4 w-full items-center">
                  <input
                    type="search"
                    placeholder="  Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-5 text-white bg-[#2D245B] h-[42px] w-[243px] rounded-full font-satoshi"
                  />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="rounded-full text-white bg-[#2D245B] h-[42px] w-[243px] px-5 pr-4 font-satoshi"
                  >
                    <option value="" disabled>
                      Select Filter
                    </option>
                    {filterOpt.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleSearch}
                    className="rounded-full w-[99px] h-[42px] font-satoshi font-bold px-3 bg-[#2D245B] text-white hover:bg-gray-500 cursor-pointer"
                  >
                    Search
                  </Button>
                </div>
                <div className="w-3/4 flex flex-row gap-5 justify-end">
                  {showGoogleButton && (
                    <Button
                      onClick={handleAuth}
                      variant="outline"
                      className="bg-[#B797FF] w-[162.2px] h-[42] rounded-[8px] font-satoshi"
                    >
                      <AddIcon /> Google
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <TabPanel value="0">
            {loader ? (
              <SkeletonCard />
            ) : (
              <InboxTable
                picklistData={picklistData}
                refreshData={fetchData}
                picklistName="Inbox"
              />
            )}
          </TabPanel>

          <TabPanel value="1">
            {loader ? <SkeletonCard /> : <MailingTable />}
          </TabPanel>

          <TabPanel value="2">
            <TabContext value={bulkSubTab}>
              <Box sx={{ borderBottom: 1, borderColor: "divider", color: "#fff" }}>
                <TabList onChange={(event, newValue) => setBulkSubTab(newValue)} aria-label="bulk email subtabs">
                  <Tab label="Contact Lists" value="0" />
                  <Tab label="Bulk Jobs" value="1" />
                </TabList>
              </Box>
              <TabPanel value="0">
                <ContactListsTable />
              </TabPanel>
              <TabPanel value="1">
                <BulkJobsTable />
              </TabPanel>
            </TabContext>
          </TabPanel>

          <TabPanel value="3">
            <TabContext value={templatesSubTab}>
              <Box sx={{ borderBottom: 1, borderColor: "divider", color: "#fff" }}>
                <TabList onChange={(event, newValue) => setTemplatesSubTab(newValue)} aria-label="templates subtabs">
                  <Tab label="Contact Lists" value="0" />
                  <Tab label="Templates & Newsletters" value="1" />
                </TabList>
              </Box>
              <TabPanel value="0">
                <ContactListsTable />
              </TabPanel>
              <TabPanel value="1">
                <TemplatesTable />
              </TabPanel>
            </TabContext>
          </TabPanel>
        </TabContext>
      </Box>

      <AddEmailCredentials
        open={userTypeModal}
        handleClose={() => setUserTypeModal(false)}
      />
    </main>
  );
}

export default MailingComp;
