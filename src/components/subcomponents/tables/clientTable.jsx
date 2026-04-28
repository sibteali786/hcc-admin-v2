import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
  
} from "@/components/ui/table";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import moment from "moment";
import axios from "axios";
import { apiPath } from "@/utils/routes";
import Swal from "sweetalert2";
import AddEmployee from "../drawers/employeeAdd";
import React, { useState } from "react";
//import EmployeeDetails from "../drawers/empOpen.jsx";
import AddCLient from "../drawers/addClient";
import ClientDetails from "../drawers/clientOpen";
import Pagination from "@mui/material/Pagination";

function EmployeeTable({ allEmp, refreshData,  currentPage, totalPages, onPageChange, }) {
  const [empModal, setEmpModal] = useState(false);
  const [empId, setEmpId] = useState("");
  const [openModal, setOpenModal] = useState(false);

  // const [currentPage, setCurrentPage] = useState(1);
  //   const itemsPerPage = 8; 
  
    
  //   const indexOfLastItem = currentPage * itemsPerPage;
  //   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  //   const currentItems = allEmp.slice(indexOfFirstItem, indexOfLastItem);
    const [selectedPriorities, setSelectedPriorities] = useState({});
    const getDisplayValue = (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (typeof value === "object") return value.name || value.label || value.value || "";
      return "";
    };

  
    const handlePriorityChange = (clientId, value) => {
          setSelectedPriorities((prev) => ({
            ...prev,
            [clientId]: value,
          }));
        };

    const handleAddToResearch = async (clientId) => {
      const priority = selectedPriorities[clientId];

      if (!priority) {
        alert("Please select a priority level before adding to research.");
        return;
      }

      try {
        const res = await axios.patch(`${apiPath.prodPath}/api/clients/changeResearchTag/${clientId}`, {
          researchTag: true,
          researchPriority: priority,
        });

        if (res.status === 200) {
          alert("Client added to research successfully");
          refreshData(); 
        }
      } catch (error) {
        console.error("Failed to update research tag:", error);
        alert("Error updating client research tag");
      }
    };




    const handlePageChange = (event, page) => {
      setCurrentPage(page);
    };

  const handleEdit = (item) => {
    setEmpId(item._id);
    setEmpModal(true);
  };
  const handleOpenModal = (item) => {
    setEmpId(item._id);
    setOpenModal(true);
  };
  const handleDelete = (id) => {
    Swal.fire({
      icon: "warning",
      text: "Are you sure you want to delete the Client",
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${apiPath.prodPath}/api/clients/delete/${id}`)
          .then((res) => {
            refreshData();
          })
          .catch((err) => console.log(err));
      }
    });
  };
  const editEmp = (data) => {
    axios
      .put(`${apiPath.prodPath}/api/clients/edit/${empId}`, data)
      .then((res) => {
        console.log(res);
        refreshData();
      })
      .catch((err) => console.log(err));
  };


  return (
    <div>
      {allEmp.length ? (
        <>
        <Table className="bg-[#231C46] rounded-[12px] font-satoshi">
          <TableCaption>A list of all Clients</TableCaption>
          <TableHeader >
            <TableRow className="w-fit, h-[58px] font-satoshi text-lg text-[#E1C9FF]">
              <TableHead className="text-[#E1C9FF]">Actions</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Company/Client Name</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Primary Contact Name</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Email</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Created At</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Phone</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Cell</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Research Priority</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Add to Research</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Address 1</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Address 2</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>City</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>State</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>ZipCode</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Website</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Status</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Client Need Category</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Client Need Sub-Category</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Lead Status</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>Bus Registration Date</TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>
                Territory
              </TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>
                Territory Manager
              </TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>
                Assigned To
              </TableHead>
              <TableHead className="text-[#E1C9FF]" style={{ minWidth: 250 }}>
                Assigned By
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allEmp.length>0 ?  (allEmp.map((i) => {
              return (
                <TableRow className="w-fit, h-[72px] bg-[#2D245B] border-[1px] border-[#452C95]" key={i._id}>
                  <TableCell className="font-satoshi font-medium text-[#E1C9FF]">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenModal(i)}>
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(i)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(i._id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.clientName}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.primaryContact}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.email}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {moment(i.createdAt).format("MM-DD-YYYY")}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.phone == "" ? "" : i.phone}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.cell == "" ? "" : i.cell}
                  </TableCell>
                   <TableCell>
                      <select
                        className="bg-[#1b071b] text-white px-2 py-1 rounded"
                        value={selectedPriorities[i._id] || ""}
                        onChange={(e) => handlePriorityChange(i._id, e.target.value)}
                      >
                        <option value="">Select Priority</option>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                      </select>
                    </TableCell>

                    <TableCell>
                      <button
                        className={`px-3 py-1 rounded text-white ${
                          i.researchTag ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                        }`}
                        onClick={() => handleAddToResearch(i._id)}
                        disabled={i.researchTag}
                      >
                        {i.researchTag ? "Under Research" : "Add to Research"}
                      </button>
                    </TableCell>
                  
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.address1}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.address2}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.city}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.state}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.zipCode}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.websiteAddress}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.status}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {[i?.needCategory?.categoryName || "", i?.needCategory?.categoryCode || ""]
                      .filter(Boolean)
                      .join(" - ")}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {[i?.needCategory?.subCategory?.subCategoryName || "", i?.needCategory?.subCategory?.subCategoryCode || ""]
                      .filter(Boolean)
                      .join(" - ")}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.leadStatus}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.businessRegistrationDate == "" ? "N/A" : moment(i.busRegDate).format("MM-DD-YYYY")}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {i.territory}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {getDisplayValue(i.territoryManager)}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {getDisplayValue(i.assignedTo)}
                  </TableCell>
                  <TableCell className="font-satoshi font-medium text-#fff">
                    {getDisplayValue(i.assignedBy || i.assignee)}
                  </TableCell>
                 

                  {empModal && empId == i._id ? (
                    <AddCLient
                      open={empModal}
                      handleClose={() => setEmpModal(false)}
                      addEmp={(data) => addEmp(data)}
                      edit={true}
                      editData={i}
                      editEmp={editEmp}
                    />
                  ) : null}
                  {openModal && empId == i._id ? (
                    <ClientDetails
                      open={openModal}
                      handleClose={() => setOpenModal(false)}
                      item={i}
                      refreshData = {refreshData}
                    />
                  ) : null}
                </TableRow>
              );
            })):null}
          </TableBody>
          
        </Table>
                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={onPageChange}
                        sx={{
                          marginTop: "20px",
                          display: "flex",
                          justifyContent: "center",
                          borderRadius: "20px", 
                          backgroundColor: "#333", 
                            
                          ".MuiPaginationItem-root": {
                            color: "white", 
                          },
                          ".MuiPaginationItem-root.Mui-selected": {
                            backgroundColor: "#555", 
                            color: "white", 
                          },
                          ".MuiPaginationItem-root:hover": {
                            backgroundColor: "#444", 
                          },
                        }}
                      />
        
                  </>
      ) : (
        <p className="text-xl">No Client Data found</p>
      )}
    </div>
  );
}

export default EmployeeTable;
