"use client";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/utils/routes";
import axios from "axios";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { ClearAll, Email, Refresh } from "@mui/icons-material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import useAuthStore from "@/store/store";
import Pagination from "@mui/material/Pagination";
import ClientDetails from "@/components/subcomponents/drawers/clientOpen";
import AddClientResearch from "@/components/subcomponents/drawers/clientResearchOpen";
import SendEmailViaGmail from "../drawers/mailingDrawer";
import SendBulkEmailViaGmail from "../drawers/bulkEmialDrawer";




function MailingTable( {clientItem}) {
  const user = useAuthStore((state)=> state.user);
  const [loader, setLoader] = useState();
  const [empModal, setEmpModal] = useState(false);
  const [clients, setClients] = useState(clientItem || []);
  const [newClients, setNewClients] = useState([]);
  const IsUser = user ? true : false;
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [openClient, setOpenClient] = useState({});
  const [handleClose, setHandleClose] = useState(false);
  const [empId, setEmpId] = useState("");
  const [openResearchModal, setOpenResearchModal] = useState(false);
  const [openMailingModal, setOpenMailingModal] = useState(false);
  const [email, setEmail] = useState("");
  const [openBulkMailModal, setOpenBulkMailModal] = useState(false);

  const refreshData = async () => {
  setLoader(true);
  try {
    const res = await axios.get(`${apiPath.prodPath}/api/clients/allNewLeads`, {
    params: {
      status: "Lead",
      researchStatus: "No Research Done",
      assignedTo: `${user.user.firstName} ${user.user.secondName}`,
      fields: "clientName,email,companyName,phone,assignedTo,assignee,status",
      limit: 10,
      page: 1,
    },
  });
    setClients(res.data.data);
    setLoader(false);
    Swal.fire({
      icon: "success",
      text: "Data refreshed successfully",
    });
    console.log(res.data);
  } catch (err) {
    console.log(err);
    Swal.fire({
      icon: "error",
      text: "Something went wrong with the data fetching",
    });
    setLoader(false);
  }
};

  


  useEffect(() => {
  setLoader(true);
  try {
    const assignedToParam = `${user.user.firstName} ${user.user.secondName}`;
    axios.get(`${apiPath.prodPath}/api/clients/allNewLeads`, {
    params: {
      status: "Lead",
      researchStatus: "No Research Done",
      assignedTo: assignedToParam,
      fields: "clientName,email,companyName,phone,assignedTo,assignee,status",
      limit: 10,
      page: 1,
    },
  }).then((res)=>{
    setClients(res.data.data);
    setLoader(false);
    console.log(res.data);
  })
    
  } catch (err) {
    console.log(err);
    Swal.fire({
      icon: "error",
      text: "Something went wrong with the data fetching",
    });
    setLoader(false);
  }
}, []);

useEffect(() => {
  if (clients.length > 0 && user?.user?.firstName) {
    // const filtered = clients.filter(
    //   (client) =>
    //     client.status === "Lead" &&
    //     client.researchStatus === "No Research Done" &&
    //     client.assignedTo === `${user.user.firstName} ${user.user.secondName}`
    // );
    setNewClients(clients);
  }
}, [clients, user]);
   
  useEffect(() => {
          setLoader(true);
            try {
              axios.get(`${apiPath.prodPath}/api/clients/allNewLeads`, {
              params: {
                status: "Lead",
                researchStatus: "No Research Done",
                assignedTo: `${user.user.firstName} ${user.user.secondName}`,
                fields: "clientName,email,companyName,phone,assignedTo,assignee,status",
                limit: 10,
                page: currentPage,
              },
            }).then((res)=>{
              setClients(res.data.data);
              setLoader(false);
              console.log(res.data);
            })
              
            } catch (err) {
              console.log(err);
              Swal.fire({
                icon: "error",
                text: "Something went wrong with the data fetching",
              });
              setLoader(false);
            }
        }, [currentPage]);
  
  const handlePageChange = (event, page) => {
      setCurrentPage(page); 
    };
   
  let clientColor = (clients.length > 0 ? "text-red-500" : "text-blue-500");

  async function handleOpenModal (id) {
    try {
          await axios.get(`${apiPath.prodPath}/api/clients/client/${id}`).then((res)=>{
          setOpenClient(res.data);
          console.log(res.data);
        }) 
        } catch (err) {
          console.log(err);
          Swal.fire({
            icon: "error",
            text: "Something went wrong with the data fetching",
          });
        }
    setOpenModal(true);
    setEmpId(id);
    
  }

  const refreshOpenData = async (id)=>{
    try {
          await axios.get(`${apiPath.prodPath}/api/clients/client/${id}`).then((res)=>{
          setOpenClient(res.data);
          console.log(res.data);
        }) 
        } catch (err) {
          console.log(err);
          Swal.fire({
            icon: "error",
            text: "Something went wrong with the data fetching",
          });
        }
  }

  async function handleOpenResearchModal (id) {
    try {
          await axios.get(`${apiPath.prodPath}/api/clients/client/${id}`).then((res)=>{
          setOpenClient(res.data);
          console.log(res.data);
        }) 
        } catch (err) {
          console.log(err);
          Swal.fire({
            icon: "error",
            text: "Something went wrong with the data fetching",
          });
        }
    setOpenResearchModal(true);
    setEmpId(id);
  }

  const handleSendMail = async (id, email) => {
    setOpenMailingModal(true);
    setEmpId(id);
    setEmail(email);
  };

  const bulkEmail = async () => {
    setOpenBulkMailModal(true);
  };

  return (
      <div className="mt-5 w-full">
        {loader ? "loading...." : (
          <div className="flex flex-col gap-2 border-2 border-[#452C95] shadow-lg h-[100%] rounded-[12px] p-4 bg-[#231C46] w-[100%]">
            <div className="flex flex-row items-center gap-2">
                  {/* <p className="w-1/3">New Client</p>
            <p className={`w-1/3 ${clientColor}`}>{newClients.length > 0 ? `You have ${newClients.length} new clients.` : "No new clients."}</p> */}
              <Button
                className="bg-[#452C95] w-1/3 text-white hover:bg-[#452C95] hover:opacity-80"
                onClick={() => refreshData()}
              >
                <Refresh className="mr-2" />
                Refresh
              </Button>
              <Button
                className="bg-[#452C95] w-1/3 text-white hover:bg-[#452C95] hover:opacity-80"
                onClick={() => bulkEmail()}
              >
              <Email className="mr-2" />
                Email All
              </Button>
            </div>
           
            <div>
              
              <div className="flex justify-start mb-4">
                {/* <Accordion className="w-full">
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Click to View New Clients assigned to you for research</Typography>
                      </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer component={Paper}> */}
                { newClients.length > 0 && !loader && (
                  <>
                  
                  <Table className="bg-[#231C46] rounded-[12px] font-satoshi">
                    <TableCaption>{`${user.user.firstName} ${user.user.secondName}`}</TableCaption>
                      <TableHeader>
                        <TableRow className="w-fit, h-[58px] font-satoshi text-lg text-[#E1C9FF]">
                          <TableHead className="text-[#E1C9FF]">Actions</TableHead>
                          <TableHead className="text-[#E1C9FF]" style={{ minWidth: 150 }}>Name</TableHead>
                          <TableHead className="text-[#E1C9FF]" style={{ minWidth: 150 }}>Company Name</TableHead>
                          <TableHead className="text-[#E1C9FF]" style={{ minWidth: 100 }}>Email</TableHead>
                          <TableHead className="text-[#E1C9FF]" style={{ minWidth: 150 }}>Phone</TableHead>
                          <TableHead className="text-[#E1C9FF]" style={{ minWidth: 150 }}>Status</TableHead>
                          <TableHead className="text-[#E1C9FF]" style={{ minWidth: 150 }}>Send Mail</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newClients === undefined ? "N/A" : newClients.map((item)=> 
                            <TableRow className="w-fit, h-[72px] bg-[#2D245B] border-[1px] border-[#452C95]" key={item._id}>
                            <TableCell className="font-satoshi font-medium text-[#E1C9FF]">
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <MoreVertIcon />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleOpenModal(item._id)}>
                                    Open Client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenResearchModal(item._id)}>
                                    Open Client Research
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRemove(item._id)}>
                                    Remove From List
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                            <TableCell className="font-satoshi font-medium text-[#fff]">
                              {item.clientName}
                            </TableCell>
                            <TableCell className="font-satoshi font-medium text-[#fff]">
                              {item.companyName}
                            </TableCell>
                            <TableCell className="font-satoshi font-medium text-[#fff]">
                              {item.email}
                            </TableCell>
                            <TableCell className="font-satoshi font-medium text-[#fff]">
                              {item.phone}
                            </TableCell>
                            <TableCell className="font-satoshi font-medium text-[#fff]">
                              {item.status}
                            </TableCell>
                            <TableCell className="font-satoshi font-medium text-[#fff]">
                              <Button
                                className="bg-[#452C95] w-full text-white hover:bg-[#452C95]"
                                onClick={() => handleSendMail(item._id, item.email)}
                              >
                                Send Mail
                              </Button>
                            </TableCell>

                          {openClient && empId == item._id ? (
                            <ClientDetails
                              open={openModal}
                              handleClose={() => setOpenModal(false)}
                              item={openClient}
                              refreshData = {refreshOpenData}
                            />
                          ) : null}
                          {openResearchModal && empId == item._id ? (
                            <AddClientResearch
                              open={openResearchModal}
                              handleClose={() => setOpenResearchModal(false)}
                              item={openClient}
                            />
                          ) : null}
                            {openMailingModal && empId == item._id ? (
                                <SendEmailViaGmail
                                  open={openMailingModal}
                                  handleClose={() => setOpenMailingModal(false)}
                                  email={email}
                                  item={openClient}
                                />
                            ) : null}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    </>
                    
                  )
                }
                {/* </TableContainer>
             </AccordionDetails>
           </Accordion> */}
                
              </div>
            
            </div>
            {openBulkMailModal ? (
              <SendBulkEmailViaGmail
                open={openBulkMailModal}
                handleClose={() => setOpenBulkMailModal(false)}
                emails={email}
                newClients={newClients || []}
              />
            ) : null}
          </div>
          
        )}
       <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
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
      </div>
  );
}

export default MailingTable;
