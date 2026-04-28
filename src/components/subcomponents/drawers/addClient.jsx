import Drawer from "@mui/material/Drawer";
import "./style.scss";
import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import { apiPath } from "@/utils/routes";
import Checkbox from "@mui/material/Checkbox";
import { FormControlLabel } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import debounce from "lodash.debounce";
import Swal from "sweetalert2";
import moment from "moment";
import { ToggleButtonGroup, ToggleButton, Typography, Box } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";



function AddCLient({ open, handleClose, addEmp, edit, editData, editEmp }) {
  const [clientName, setClientName] = useState("");
  const [primaryContact, setPrimaryContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  
  const [state, setState] = useState("");
  const [zipCodeLoader, setZipCodeLoader] = useState(false);
  const [zipCodeOpt, setZipCodeOpt] = useState([]);
  const [zipCode, setZipCode] = useState("");
  const [websiteAddress, setWebsiteAddress] = useState("");
  const [status, setStatus] = useState("");
  const [statusOpt, setStatusOpt] = useState([]);
  const [territoryOpt, setTerritoryOpt] = useState([]);
  const [territory, setTerritory] = useState("");
  const [inputTerritoryValue, setInputTerritoryValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [inputStatusValue, setInputStatusValue] = useState("");
  const [empOpt, setEmpOpt] = useState([]);
  const [territoryManager, setTerritoryManager] = useState("");
  const [inputTerritoryManager, setInputTerritoryManager] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [inputAssignedTo, setInputAssignedTo] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [inputAssignedBy, setInputAssignedBy] = useState("");
  const [busRegDate, setBusRegDate] = useState("");
  const [cityOpt, setCityOpt] = useState([]);
  const [city, setCity] = useState("");
  const [inputValueCity, setInputValueCity] = useState("");
  const [needCategory, setNeedCategory] = useState({});
  const [needCatgoryOpt, setNeedCatgoryOpt] = useState([]);
  const [inputNeedCategory, setInputNeedCategory] = useState("");
  const [needSubCategory, setNeedSubCategory] = useState();
  const [needSubCategoryOpt, setNeedSubCategoryOpt] = useState([]);
  const [inputNeedSub, setInputNeedSub] = useState("");
  const [needCategoryName, setNeedCategoryName] = useState("");
  const [needCategoryCode, setNeedCategoryCode] = useState("");
  const [needSubCategoryName, setNeedSubCategoryName] = useState("");
  const [needSubCategoryCode, setNeedSubCategoryCode] = useState("");
  const [leadStatusOpt, setLeadStatusOpt] = useState([]);
  const [leadStatus, setLeadStatus] = useState("");
  const [inputLeadStatusValue, setInputLeadStatusValue] = useState("");
  const [researchPriority, setResearchPriority] = useState("");
  const [researchTag, setResearchTag] = useState(false);
  const getPersonName = (person) => {
    if (!person) return "";
    if (typeof person === "string") return person;
    if (typeof person === "object") return person.name || person.fullName || person.label || "";
    return "";
  };

  const toSelectValue = (value) => {
    const parsed = getPersonName(value);
    if (!parsed || parsed === "undefined") return "";
    return { label: parsed, value: parsed };
  };

  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      setResearchTag(newValue);
    }
  };


  const getNeedCatgory = async () => {
    const needCatgory = await axios.get(`${apiPath.prodPath}/api/picklist/needCategory/getAllNeedCategory`)
    .then((res) => {
      const needCatgory = res.data.needCategory;
      return needCatgory;
    });
    const options = needCatgory.map((item)=>{
      const statusOption = {
        label : item.categoryName,
        value : item.categoryName,
        categoryName : item.categoryName,
        categoryCode : item.categoryCode,
        subCategory : item.subCategory,
      }
      return statusOption;
    });
    setNeedCatgoryOpt(options);
  }

  const getLeadStatus = async () => {
    const leadStatus = await axios.get(`${apiPath.prodPath}/api/picklist/status/getAllStatus`)
    .then((res) => {
      const leadStatus = res.data.status;
      return leadStatus;
    });
    const options = leadStatus.map((item)=>{
      const statusOption = {
        label : item.statusName,
        value : item.statusName,
        statusName : item.statusName,
        statusCode : item.statusCode,
      }
      return statusOption;
    });
    setLeadStatusOpt(options);
  }

  const handleInputNeedCategoryChange = (newInputValue) => {
    setInputNeedCategory(newInputValue);
    
  };

  const handleNeedCategoryChange = (v) => {
    setNeedCategory(v);
    setNeedCategoryName(v.categoryName);
    setNeedCategoryCode(v.categoryCode);
    setNeedSubCategoryOpt(v.subCategory.map((item)=> {
      const sorts = {
        label:item.subCategoryName,
        value:item.subCategoryName,
        subCategoryCode : item.subCategoryCode,
      }
      return sorts;
    }));
  };

  useEffect(() => {
    // fileCatagoryOptions();
    getNeedCatgory();
    getLeadStatus();
    axios
        .get(`${apiPath.prodPath}/api/picklist/territory/getallterritory`)
        .then((res) => {
          console.log(res.data);
          const Territory = res.data.territories;
          TerritoryOptions(Territory);
        });

        axios
        .get(`${apiPath.prodPath}/api/users/allusers`)
        .then((res) => {
          const name = res.data.map((item) => {
            const fullname = item.firstName + " " + item.secondName;
            console.log(fullname);
            return fullname;
          });
          const options = name.map((item)=>{
            const statusOption = {
              label : item,
              value : item,
            }
            return statusOption;
          });
          setEmpOpt(options);
        })
        .catch((err) => {
          console.log(err);
          Swal.fire({
            icon: "error",
            text: "Something went wrong with the data fetching",
          });
        });
    
    statusOptions();
    getZipCodes();
    if (edit) {
      setClientName(editData.clientName);
      setStatus(editData.status !== "undefined" && editData.status ? { label: editData.status, value: editData.status}: "");
      setPrimaryContact(editData.primaryContact);
      setEmail(editData.email);
      setPhone(editData.phone);
      setFax(editData.fax);
      setAddress1(editData.address1);
      setAddress2(editData.address2);
      setCity({label : editData.city, value : editData.city});
      setState(editData.state);
      setZipCode({ label: editData.zipCode, value: editData.zipCode });
      setWebsiteAddress(editData.websiteAddress);
      // setStatus(editData.status.value);
      setTerritory(editData.territory !== "undefined" && editData.territory ? { label: editData.territory, value: editData.territory}: "");
      setTerritoryManager(toSelectValue(editData.territoryManager));
      setAssignedTo(toSelectValue(editData.assignedTo));
      setAssignedBy(toSelectValue(editData.assignedBy || editData.assignee));
      setBusRegDate(editData.busRegDate ? moment(editData.busRegDate).format('YYYY-MM-DD') : "");
      setResearchPriority(editData.researchPriority !== "undefined" && editData.researchPriority ? { label: editData.researchPriority, value: editData.researchPriority } : "");
    }
  }, [open]);
  const handleAddClient = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("clientName", clientName);
    formData.append("primaryContact", primaryContact);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("fax", fax);
    formData.append("address1", address1);
    formData.append("address2", address2);
    formData.append("city", city.value);
    formData.append("state", state);
    formData.append("zipCode", zipCode.value);
    formData.append("websiteAddress", websiteAddress);
    formData.append("status", status.value);
    formData.append("territory", territory.value);
    formData.append("territoryManager", territoryManager.value);
    formData.append("assignedTo", assignedTo.value);
    formData.append("assignee", assignedBy.value);
    formData.append("busRegDate", busRegDate.toString());
    formData.append("needCategoryName", needCategoryName);
    formData.append("needCategoryCode", needCategoryCode);
    formData.append("needSubCategoryName", needSubCategoryName);
    formData.append("needSubCategoryCode", needSubCategoryCode);
    formData.append("leadStatus", leadStatus.value);
    formData.append("researchPriority", researchPriority);
    formData.append("researchTag", researchTag);

    if (edit) {
      editEmp(formData);
    } else {
      addEmp(formData);
      dataReset();
    }
  };
  const dataReset = () => {
    setClientName("");
    setPrimaryContact("");
    setEmail("");
    setPhone("");
    setFax("");
    setAddress1("");
    setAddress2("");
    setCity("");
    setState("");
    setZipCode("");
    setWebsiteAddress("");
    setStatus("")
    setTerritory("")
    setTerritoryManager("")
    setAssignedTo("")
    setAssignedBy("")
    setBusRegDate("");
    setResearchPriority("");
    setResearchTag(false);
  };

  // const getZipCodes = () => {
  //   setZipCodeLoader(true);
  //   axios
  //     .get(`${apiPath.prodPath}/api/picklist/zipcodes/getzipcodes`)
  //     .then((res) => {
  //       console.log(res.data);
  //       res.data.zipCodes.map((i) => {
  //         console.log("##", i.zipCode);
  //       });
  //       const sortedData = res.data.zipCodes.map((i) => {
  //         return {
  //           label: i.zipCode,
  //           value: i.zipCode,
  //           city: i.city,
  //           state: i.state,
  //         };
  //       });
  //       setZipCodeOpt(sortedData);
  //       setZipCodeLoader(false);
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       setZipCodeLoader(false);
  //     });
  // };

  async function statusOptions () {
    const clientStatus = await axios.get(`${apiPath.prodPath}/api/picklist/clientStatus/getAllclientStatus`)
    .then((res) => {
      const status = res.data.clientStatus;
      console.log(status)
      return status;
    });
    // const stats = ['lead', 'client'];
    const options = clientStatus.map((item)=>{
      const statusOption = {
        label : item.status,
        value : item.status,
      }
      return statusOption;
    });
    setStatusOpt(options);
  }

  async function TerritoryOptions (Territory) {
  
    const options = Territory.map((item)=>{
      const statusOption = {
        label : item.territoryName,
        value : item.territoryName,
      }
      return statusOption;
    });
    setTerritoryOpt(options);
  }

  // function fileCatagoryOptions () {
  //   const fileCategories = ["Invoice", "Contract", "Report", "Others"];
  //   const options = fileCategories.map((item)=>{
  //     const statusOption = {
  //       label : item,
  //       value : item,
  //     }
  //     return statusOption;
  //   });
  //   setFileCategoryOpt(options);
  // }

  
  
  const getZipCodes = async (search = "") => {
    setZipCodeLoader(true); 
    try {
      const res = await axios.get(
        `${apiPath.prodPath}/api/picklist/zipcodes/getzipcodes`,
        {
          params: {
            search, 
            limit: 50,
          },
        }
      );
      const sortedData = res.data.zipCodes.map((i) => ({
        label: i.zipCode,
        value: i.zipCode,
        city: i.city,
        state: i.state,
      }));
      setZipCodeOpt(sortedData); 
    } catch (err) {
      console.log(err);
    } finally {
      setZipCodeLoader(false); 
    }
  };
  const debouncedGetZipCodes = debounce((inputValue) => {
    if (inputValue) {
      getZipCodes(inputValue);
    } else {
      setZipCodeOpt([]); 
    }
  }, 300);
  const handleInputChange = (newInputValue) => {
    setInputValue(newInputValue); 
    debouncedGetZipCodes(newInputValue); 
  };
  const handleInputStatusChange = (newInputValue) => {
    setInputStatusValue(newInputValue); 
  };
  const handleInputTerritoryChange = (newInputValue) => {
    setInputTerritoryValue(newInputValue); 
  };
  const handleInputCityChange = (newInputValue) => {
    setInputValueCity(newInputValue); 
  };

  const handleInputNeedSubChange = (newInputValue) => {
    setInputNeedSub(newInputValue);
  };

  const handleInputLeadStatusChange = (newInputValue) => {
    setInputLeadStatusValue(newInputValue); 
  };

  // const handleFileChange = (event) => {
  //   const selectedFiles = Array.from(event.target.files);
  //   setFiles(selectedFiles);
  // };
  // const handleInputFileCatagory = (newInputValue) => {
  //   setInputFileCatagory(newInputValue); 
  // };

  const handleInputTerritoryManagerChange = (newInputValue) => {
    setInputTerritoryManager(newInputValue);
  };
  const handleInputAssignedToChange = (newInputValue) => {
    setInputAssignedTo(newInputValue);
  };
  const handleInputAssignedByChange = (newInputValue) => {
    setInputAssignedBy(newInputValue);
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "#191526", 
      color: "white", 
      borderRadius: "12px",       
      padding: "5px",            
      borderColor: "#452C95",
      "&:hover": {
        borderColor: "darkviolet",
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#191526",
      borderRadius: "12px",       
      padding: "5px", 
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "darkviolet" : "#191526", 
      color: "white",
      "&:hover": {
        backgroundColor: "darkviolet",
      },
      borderRadius: "12px",       
      padding: "5px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "white", 
    }),
  };

  const handleNeedSubCategoryChange = (v) => {
    setNeedSubCategory(v);
    setNeedSubCategoryName(v.label);
    setNeedSubCategoryCode(v.subCategoryCode);
  }

  const handleChangeCity = (v) => {
    setCity(v);
  }

  return (
    <>
      <Drawer
        className="bg-all-modals"
        anchor="left" 
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: "1142px",  
            height: "dvh", 
            position: "absolute",
            left: "15%",
            top: "1%",
            transform: "translate(-50%, -50%)",
            borderRadius: "16px", 
            boxShadow: 3, 
            marginTop : "30px",
            marginBottom: "30px",
          },
        }}
        >
        <div className="p-10 flex flex-col bg-[#2D245B] flex-wrap">
          <div className="flex flex-row justify-end">
            <CloseIcon
              className="text-2xl hover:cursor-pointer"
              onClick={() => handleClose()}
            />
          </div>
          <h1 className="text-white font-satoshi text-2xl font-bold mb-5">Add Lead/Client</h1>
          <form
            onSubmit={handleAddClient}
            className="flex flex-col flex-wrap gap-5 items-center scroll-my-2"
          >
            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
                <div className="flex flex-col gap-2 w-1/3">
                  <label className="font-satoshi text-md">Company/Client Name</label>
                  <input
                    type="text"
                    className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter Client Name"
                    name="clientName"
                  />
                </div>

                <div className="flex flex-col gap-2 w-1/3">
                  <label className="font-satoshi text-md">Status</label>
                  <Select
                      options={statusOpt}
                      value={status}
                      onInputChange={handleInputStatusChange}
                      inputValue={inputStatusValue}
                      onChange={(e) => setStatus(e)}
                      placeholder="Select Status"
                      styles={customStyles}
                      id="role-select-cus"
                      name="Status"
                    />
                </div>

                <div className="flex flex-col gap-2 w-1/3">
                  <label className="font-satoshi text-md">Territory</label>
                  <Select
                      options={territoryOpt}
                      value={territory}
                      onInputChange={handleInputTerritoryChange}
                      inputValue={inputTerritoryValue}
                      onChange={(e) => setTerritory(e)}
                      placeholder="Select Territory"
                      styles={customStyles}
                      id="role-select-cus"
                      name="Territory"
                    />
                </div>
                

            </div>

            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">

            <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">ZipCode</label>
                {                  
                  <Select
                    options={zipCodeOpt}
                    value={zipCode}
                    onInputChange={handleInputChange}
                    inputValue={inputValue}
                    onChange={(v) => {
                      setZipCode(v);
                      setCityOpt(v.city.map((item)=> {
                        const sorts = {
                          label:item,
                          value:item
                        }
                        return sorts;
                      }));
                      setState(v.state);
                    }}
                    placeholder="Select ZipCode"
                    styles={customStyles}
                    id="role-select-cus"
                    name="zipCode"
                  />
                }
              </div>
              
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">City</label>
                <Select
                    options={cityOpt}
                    value={city}
                    onInputChange={handleInputCityChange}
                    inputValue={inputValueCity}
                    onChange={handleChangeCity}
                    placeholder="Select City"
                    styles={customStyles}
                    id="role-select-cus"
                    name="City"
                  />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">State</label>
                <input
                  type="text"
                  className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter State"
                  name="state"
                />
              </div>
          </div>

            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Primary Contact Name</label>
                <input
                  type="text"
                  className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={primaryContact}
                  onChange={(e) => setPrimaryContact(e.target.value)}
                  placeholder="Enter Primary Contact"
                  name="primaryContact"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Email</label>
                <input
                  type="email"
                  className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email"
                  name="email"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Phone</label>
                <input
                  type="text"
                  className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter Phone"
                  name="phone"
                />
              </div>
            </div>
            
            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Fax#</label>
                <input
                  type="text"
                  className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={fax}
                  onChange={(e) => setFax(e.target.value)}
                  placeholder="Enter Fax Address"
                  name="fax"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Address 1</label>
                <input
                  type="text"
                  className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="Enter Address 1"
                  name="address1"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Address 2</label>
                <input
                  type="text"
                  className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="Enter Address 2"
                  name="address2"
                />
              </div>
            </div>

            <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Territory Manager</label>
                <Select
                    options={empOpt}
                    value={territoryManager}
                    onInputChange={handleInputTerritoryManagerChange}
                    inputValue={inputTerritoryManager}
                    onChange={(e) => setTerritoryManager(e)}
                    placeholder="Select Territory Manager"
                    styles={customStyles}
                    id="role-select-cus"
                    name="Territory Manager"
                    required 
                  />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Assigned To</label>
                <Select
                    options={empOpt}
                    value={assignedTo}
                    onInputChange={handleInputAssignedToChange}
                    inputValue={inputAssignedTo}
                    onChange={(e) => setAssignedTo(e)}
                    placeholder="Select Assigned To"
                    styles={customStyles}
                    id="role-select-cus"
                    name="Assigned To"
                    required
                  />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Assigned By</label>
                <Select
                    options={empOpt}
                    value={assignedBy}
                    onInputChange={handleInputAssignedByChange}
                    inputValue={inputAssignedBy}
                    onChange={(e) => setAssignedBy(e)}
                    placeholder="Select Assigned By"
                    styles={customStyles}
                    id="role-select-cus"
                    name="Assigned By"
                    required
                  />
              </div>
            </div>
          

          <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
            <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Website Address</label>
                <input
                  type="text"
                  className="p-2 border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={websiteAddress}
                  onChange={(e) => setWebsiteAddress(e.target.value)}
                  placeholder="Enter Client Web address"
                  name="websiteAddress"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Client Need Category</label>
                <Select
                    options={needCatgoryOpt}
                    value={needCategory}
                    onInputChange={handleInputNeedCategoryChange}
                    inputValue={inputNeedCategory}
                    onChange={handleNeedCategoryChange}
                    placeholder="Select Need Category"
                    styles={customStyles}
                    id="role-select-cus"
                    name="needCategory"
                  />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Client Need Sub-Category</label>
                <Select
                    options={needSubCategoryOpt}
                    value={needSubCategory}
                    onInputChange={handleInputNeedSubChange}
                    inputValue={inputNeedSub}
                    onChange={handleNeedSubCategoryChange}
                    placeholder="Select need Sub-Category"
                    styles={customStyles}
                    id="role-select-cus"
                    name="needSubCategory"
                  />
              </div>
          </div>

          <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
               <div className="flex flex-col gap-2 w-1/3">
                  <label className="font-satoshi text-md">Lead-Status</label>
                  <Select
                      options={leadStatusOpt}
                      value={leadStatus}
                      onInputChange={handleInputLeadStatusChange}
                      inputValue={inputLeadStatusValue}
                      onChange={(e) => setLeadStatus(e)}
                      placeholder="Select Lead Status"
                      styles={customStyles}
                      id="role-select-cus"
                      name="leadStatus"
                    />
                </div>
            <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Bus Registration Date</label>
                <input
                  type="date"
                  className="p-2  border-[#452C95] rounded-[8px] focus-within:outline-none border-[1px] bg-[#191526]"
                  value={busRegDate}
                  onChange={(e) => setBusRegDate(e.target.value)}
                  placeholder="Enter Business Registration Date"
                  name="bus Registration Date"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/3">
                <label className="font-satoshi text-md">Research Priority</label>
                <select
                        className="bg-[#1b071b] text-white px-2 py-1 rounded"
                        value={researchPriority || ""}
                        onChange={(e) => setResearchPriority(e.target.value)}
                        style={customStyles}
                        id="role-select-cus"
                      >
                        <option value="">Select Priority</option>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                </select>
              </div>
          </div>

            
            
            
            {/* <div className="flex flex-col gap-2 w-1/4">
              <label className="font-regular text-md">Client Files</label>
              <input
                type="file"
                multiple
                className="p-2 bg-transparent border-b-2 border-blue-50 focus-within:outline-none"
                value={files}
                onChange={handleFileChange}
                placeholder="Upload a File"
                name="Files"
              />
            </div>
            <div className="flex flex-col gap-2 w-1/4">
              <label className="font-regular text-md">File Catagory</label>
              <Select
                  options={fileCategoryOpt}
                  value={fileCategory}
                  onInputChange={handleInputFileCatagory}
                  inputValue={inputFileCatagory}
                  onChange={(e) => setFileCategory(e)}
                  placeholder="Select File Catagory"
                  id="role-select-cus"
                  name="File Catagory"
                />
            </div> */}
             <div className="flex flex-row gap-4 w-full items-center justify-between pb-6 border-b-[1px] border-[#7F56D9]">
              
               {/* <Button
                  className={`px-3 py-1 rounded text-white ${
                          researchTag ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
                        }`}
                  onClick={() => setResearchTag(true)}
                  disabled={researchTag}
                >
                Add to Research
                </Button> */}
                <Box>
                  <p>Research</p>
                  <ToggleButtonGroup
                    value={researchTag}
                    exclusive
                    onChange={handleChange}
                    aria-label="research toggle"
                  >
                    <ToggleButton value={true} aria-label="add to research">
                      <CheckIcon /> {/* Tick */}
                    </ToggleButton>
                    <ToggleButton value={false} aria-label="remove from research">
                      <CloseIcon /> {/* Cross */}
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {researchTag === true && (
                    <Typography variant="body2" color="success.main" mt={1}>
                      ✅ Added to Research
                    </Typography>
                  )}
                  {researchTag === false && (
                    <Typography variant="body2" color="error.main" mt={1}>
                      ❌ Removed from Research
                    </Typography>
                  )}
                </Box>
             </div>

            <div className="flex flex-col items-end gap-2 w-full">
              <input
                type="submit"
                className="w-[144px] h-[42px] p-2 rounded-[8px] bg-[#7F56D9] self-end text-white hover:text-white hover:bg-orange-400"
                value={edit ? "Save" : `Add Client`}
              />
            </div>
          </form>
        </div>
      </Drawer>
    </>
  );
}

export default AddCLient;
