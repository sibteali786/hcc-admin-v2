"use client";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/utils/routes";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Swal from "sweetalert2";
import { SkeletonCard } from "@/components/reusable/skeleton-card";
// import AddEmployee from "@/components/subcomponents/drawers/employeeAdd";
import AddCLient from "@/components/subcomponents/drawers/addClient";
import ClientTable from "@/components/subcomponents/tables/clientTable";
import useStore from "@/store/store";
import { useRouter } from "next/navigation";
import Select from "react-select";
import useAuthStore from "@/store/store";
import { Search } from "lucide-react";
import Image from "next/image";
import { ClearAll } from "@mui/icons-material";




function ClientPage() {
  const [loader, setLoader] = useState(false);
  const [empModal, setEmpModal] = useState(false);
  const [allEmp, setAllEmp] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("");  
  const [filterOpt, setFilterOpt] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(1);

  const getPersonName = (person) => {
    if (!person) return "";
    if (typeof person === "string") return person;
    if (typeof person === "object") return person.name || person.fullName || "";
    return "";
  };

  const normalizeClient = (client) => ({
    ...client,
    territoryManager: getPersonName(client?.territoryManager),
    assignedTo: getPersonName(client?.assignedTo),
    assignee: getPersonName(client?.assignee),
    assignedBy: getPersonName(client?.assignedBy),
    needCategory: {
      categoryName: client?.needCategory?.categoryName || "",
      categoryCode: client?.needCategory?.categoryCode || "",
      subCategory: {
        subCategoryName: client?.needCategory?.subCategory?.subCategoryName || "",
        subCategoryCode: client?.needCategory?.subCategory?.subCategoryCode || "",
      },
    },
  });

  const normalizeClientsPayload = (payload) => {
    const clients = Array.isArray(payload?.clients)
      ? payload.clients
      : Array.isArray(payload)
      ? payload
      : [];
    return clients.map(normalizeClient);
  };


  function filterOptions() {
    const sorts = [
      'zipCode',
      // 'phone',
      // 'email',
      'status',
      'Name',
      // 'city',
      'state',
      'assignedTo',
      'territoryManager',
      'territory',
      'assignedBy'];
    const options = sorts.map((item)=>{
      const statusOption = {
        label : item,
        value : item,
      }
      return statusOption;
    });
    setFilterOpt(options);
  }



  const isUserLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const router = useRouter();

useEffect(() => {
  if (!hasHydrated) return; 

  if (!isUserLoggedIn) {
    router.push("/login");
  }
}, [isUserLoggedIn, hasHydrated]);

  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!filterBy || !searchTerm.trim()) {
      Swal.fire({
        icon: "warning",
        text: "Please select a filter and enter a search term.",
      });
      return;
    }

    setLoader(true);
    try {
      const res = await axios.get(
        `${apiPath.prodPath}/api/clients/client/?${filterBy}=${searchTerm}`
      );
      setAllEmp(normalizeClientsPayload(res.data));
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        text: "Something went wrong while fetching search results.",
      });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
        refreshData(currentPage)
      }, [currentPage]);

  const handlePageChange = (event, page) => {
    setCurrentPage(page); 
  };


  useEffect(() => {
    setLoader(true);
    filterOptions();
    axios
      .get(`${apiPath.prodPath}/api/clients/allclients`)
      .then((res) => {
        setAllEmp(normalizeClientsPayload(res.data));
        setTotalPages(res.data.totalPages);
        setLoader(false);
      })
      .catch((err) => {
        console.log(err);
        Swal.fire({
          icon: "error",
          text: "Something went wrong with the data fetching",
        });
        setLoader(false);
      });
  }, []);

  const handleEmpModal = () => {
    setEmpModal(true);
  };
  const refreshData = (page=1) => {
    setLoader(true);
    axios
      .get(`${apiPath.prodPath}/api/clients/allclients`, {
         params : {
           page: page,         
           limit: 10,
        }
      })
      .then((res) => {
        setAllEmp(normalizeClientsPayload(res.data));
        setTotalPages(res.data.totalPages);
        setLoader(false);
      })
      .catch((err) => {
        console.log(err);
        Swal.fire({
          icon: "error",
          text: "Something went wrong with the data fetching",
        });
        setLoader(false);
      });
  };
  const addEmp = (data) => {
    axios
      .post(`${apiPath.prodPath}/api/clients/add`, data)
      .then((res) => {
        Swal.fire({
          icon: "success",
          text: "Added Successfully",
        });
        setEmpModal(false);
        refreshData();
      })
      .catch((err) => {
        setEmpModal(false);
        Swal.fire({
          icon: "error",
          text: `${err.message}`,
        });
      });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setFilterBy("");
    setLoader(true);
    axios
      .get(`${apiPath.prodPath}/api/clients/allclients`)
      .then((res) => {
        setAllEmp(normalizeClientsPayload(res.data));
        setTotalPages(res.data.totalPages)
        setLoader(false);
      })
      .catch((err) => {
        console.log(err);
        Swal.fire({
          icon: "error",
          text: "Something went wrong with the data fetching",
        });
        setLoader(false);
      });
  }


  return (
    <main className="flex flex-col">
      <div className="flex w-full flex-row flex-wrap justify-between">
        <div className="w-full flex flex-row gap-2 mb-[24px] h-[34px]">
          <Image src="/CustomerSidebar.png" alt="client" width={40} height={31.7} priority/>
          <h1 className="font-satoshi font-semibold text-2xl ml-[20px]">Companies</h1>
        </div>
        <div className="flex flex-row gap-4 items-start border-none w-full">
          <form onSubmit={handleSearch} className="flex flex-row gap-4 w-full items-center">
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
                    <option value="" disabled>Select Filter</option>
                    {filterOpt.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                    </select>
                  <input
                    type="submit"
                    className="rounded-full w-[99px] h-[42px] font-satoshi font-bold px-3 bg-[#2D245B] text-white hover:bg-gray-500 cursor-pointer"
                  value={"Search"}
                  />                
               
          </form>
          <Button
            onClick={handleClearSearch}
            variant="outline"
            className="bg-[#B797FF] w-[162.2px] h-[42] rounded-[8px] font-satoshi"
          >
            <ClearAll />Clear Search
          </Button>
          <div className="w-3/4 flex flex-row gap-5 justify-end">
          <Button
            onClick={handleEmpModal}
            variant="outline"
            className="bg-[#B797FF] w-[162.2px] h-[42] rounded-[8px] font-satoshi"
          >
            <AddIcon />Add Lead/Client
          </Button>
        </div>
      </div>
 
      </div>
      <div className="mt-10">
        {loader ? (
          <SkeletonCard />
        ) : (
          <ClientTable refreshData={refreshData} allEmp={allEmp}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}/>
        )}
      </div>
      <AddCLient
        open={empModal}
        handleClose={() => setEmpModal(false)}
        addEmp={(data) => addEmp(data)}
        edit={false}
      />
    </main>
  );
}

export default ClientPage;
