import { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar,
  Container,
  Toolbar,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { userAPI, userGroupAPI } from "../apis/api";
import NavBar from "../components/NavBar";
import IOSSwitch from "../components/iOSSwitch";
import MultiSelect from "../components/SelectMultiple";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const UserManagementDashboard = () => {
  const { user, isAdmin, isRootAdmin } = useAuth();

  // Users state
  const [users, setUsers] = useState([]);
  // const [filteredUsers, setFilteredUsers] = useState([]);
  // const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // New user state
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    user_groups: [],
    is_active: true,
  });

  // User groups state
  const [userGroups, setUserGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [newGroup, setNewGroup] = useState("");

  // Notification
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadUsers();
    loadUserGroups();
  }, []);

  // useEffect(() => {
  //   // Filter users based on search query
  //   if (searchQuery.trim() === "") {
  //     setFilteredUsers(users);
  //   } else {
  //     const query = searchQuery.toLowerCase();
  //     setFilteredUsers(
  //       users.filter(
  //         (u) =>
  //           u.username.toLowerCase().includes(query) ||
  //           u.email.toLowerCase().includes(query) ||
  //           (u.user_groups && u.user_groups.toLowerCase().includes(query))
  //       )
  //     );
  //   }
  // }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userAPI.getAllUsers();
      if (response.success) {
        // console.log(response.users);
        setUsers(response.users);
        // setFilteredUsers(response.users);
      }
    } catch (error) {
      showNotification("Failed to load users", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await userGroupAPI.getAllGroups();
      if (response.success) {
        setUserGroups(response.groups);
      }
    } catch (error) {
      showNotification("Failed to load user groups", "error");
    } finally {
      setLoadingGroups(false);
    }
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      showNotification("Username, email, and password are required", "error");
      return;
    }

    try {
      const response = await userAPI.createUser(newUser);
      if (response.success) {
        showNotification("User created successfully");
        setNewUser({
          username: "",
          email: "",
          password: "",
          user_groups: [],
          is_active: true,
        });
        loadUsers();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.error || "Failed to create user",
        "error"
      );
    }
  };

  // Edit user
  const handleStartEdit = (userToEdit) => {
    setEditingUser(userToEdit.username);
    setEditFormData({
      email: userToEdit.email,
      password: "",
      user_groups: userToEdit.user_groups || "",
      is_active: userToEdit.Is_active,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (username) => {
    try {
      const updateData = { ...editFormData };

      // Remove password if empty
      if (!updateData.password || updateData.password.trim() === "") {
        delete updateData.password;
      }

      const response = await userAPI.updateUser(username, updateData);
      if (response.success) {
        showNotification("User updated successfully");
        setEditingUser(null);
        setEditFormData({});
        if(user.username === username){
          // reload page
          window.location.reload();
        }
        loadUsers();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.error || "Failed to update user",
        "error"
      );
    }
  };

  // User groups
  const handleCreateGroup = async () => {
    if (!newGroup.trim()) {
      showNotification("Group name is required", "error");
      return;
    }

    try {
      const response = await userGroupAPI.createGroup(newGroup.trim());
      if (response.success) {
        showNotification("User group created successfully");
        setNewGroup("");
        loadUserGroups();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.error || "Failed to create group",
        "error"
      );
    }
  };

  const handleRefresh = () => {
    loadUsers();
    loadUserGroups();
    showNotification("Data refreshed");
  };

  const isNewUserValid = newUser.username && newUser.email && newUser.password;

  return (
    <div>
      <NavBar />
      <Container
        maxWidth="xl"
        sx={{
          pt: 4,
          pb: 4,
          backgroundColor: "#BFBFBF",
          mt: 8,
          // m: 0,
          maxWidth: "100% !important",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#787878",
              }}
              fontWeight={"bold"}
            >
              User Management
            </Typography>
          </Box>
          {/* <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button> */}
        </Box>

        {/* Tabs */}
        {/* <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab icon={<PeopleIcon />} label="Users" />
            <Tab icon={<GroupIcon />} label="User Groups" />
          </Tabs>
        </Paper> */}

        <Paper sx={{ p: 3, backgroundColor: "#D9D9D9", borderRadius: "16px" }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder="Enter New Group"
              variant="outlined"
              size="small"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              sx={{
                backgroundColor: "#F0F0F0",
                borderRadius: "16px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px", // Adjust the value as needed
                },
              }}
              // InputProps={{
              //   startAdornment: (
              //     <InputAdornment position="start">
              //       <SearchIcon />
              //     </InputAdornment>
              //   ),
              // }}
              // sx={{ width: 300 }}
            />
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#5E5E5E",
                height: "38px",
                borderRadius: "16px",
                marginX: "20px",
                "&:hover": {
                  backgroundColor: "#5E5E5E", // Hover color
                },
              }}
              onClick={handleCreateGroup}
            >
              Create Group
            </Button>
          </Box>

          <TableContainer>
            <Table sx={{ borderSpacing: "0 10px", borderCollapse: "separate" }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Username</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Email</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Password</strong>
                  </TableCell>
                  <TableCell>
                    <strong>User Group</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Active</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong></strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* New User Row */}
                <TableRow sx={{ backgroundColor: "#EEEEEE" }}>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Username"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                      sx={{
                        backgroundColor: "#D1D1D1",
                        borderRadius: "20px",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "20px", // Adjust the value as needed
                        },
                      }}
                      fullWidth
                      required
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      sx={{
                        backgroundColor: "#D1D1D1",
                        borderRadius: "20px",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "20px", // Adjust the value as needed
                        },
                      }}
                      fullWidth
                      required
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="password"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      sx={{
                        backgroundColor: "#D1D1D1",
                        borderRadius: "20px",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "20px", // Adjust the value as needed
                        },
                      }}
                      fullWidth
                      required
                    />
                  </TableCell>
                  <TableCell>
                    {/* <FormControl size="small" fullWidth>
                        <InputLabel>User Groups</InputLabel>
                        <Select
                          sx={{
                            backgroundColor: "#D1D1D1",
                            borderRadius: "20px",
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "20px", // Adjust the value as needed
                            },
                          }}
                          multiple
                          value={newUser.user_groups}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              user_groups: e.target.value,
                            })
                          }
                          label="User Groups"
                          MenuProps={MenuProps}
                        >
                          {userGroups.map((group) => (
                            <MenuItem key={group} value={group}>
                              {group}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl> */}
                    <MultiSelect
                      options={userGroups}
                      placeholder={"Select Groups"}
                      value={newUser.user_groups}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          user_groups: e.target.value,
                        })
                      }
                      sx={{
                        backgroundColor: "#D1D1D1",
                        borderRadius: "20px",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "20px", // Adjust the value as needed
                        },
                      }}
                      width={240}
                    />
                  </TableCell>
                  <TableCell>
                    <IOSSwitch
                      checked={newUser.is_active}
                      onChange={(e) =>
                        setNewUser({
                          ...newUser,
                          is_active: e.target.checked,
                        })
                      }
                      size="small"
                    />
                    {/* <Switch
                        checked={newUser.is_active}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            is_active: e.target.checked,
                          })
                        }
                        size="small"
                      /> */}
                  </TableCell>
                  <TableCell align="right">
                    {/* <Tooltip title="Create User">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={handleCreateUser}
                            disabled={!isNewUserValid}
                          >
                            <SaveIcon />
                          </IconButton>
                        </span>
                      </Tooltip> */}
                    {/* <Tooltip title="Clear">
                        <IconButton size="small" onClick={handleCancelCreate}>
                          <CancelIcon />
                        </IconButton>
                      </Tooltip> */}
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "#5E5E5E",
                        height: "32px",
                        borderRadius: "16px",
                        marginX: "20px",
                        "&:hover": {
                          backgroundColor: "#5E5E5E", // Hover color
                        },
                      }}
                      disableElevation
                      onClick={handleCreateUser}
                    >
                      Create
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Existing Users */}
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {"No users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isEditing = editingUser === u.username;
                    const isCurrentUser = u.username === user?.username;
                    const isThisRootAdmin = u.username === "root_admin";
                    // if (isCurrentUser) return <></>;

                    return (
                      <TableRow
                        key={u.username}
                        sx={{ backgroundColor: "#EEEEEE" }}
                      >
                        {/* Username */}
                        <TableCell>
                          <Box
                            sx={{
                              // backgroundColor: "#D1D1D1",
                              padding: "8px 14px",
                              borderRadius: "16px",
                            }}
                          >
                            <Typography color={"#787878"} fontWeight={"bold"}>
                              {u.username}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Email */}
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="email"
                              value={editFormData.email}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  email: e.target.value,
                                })
                              }
                              sx={{
                                backgroundColor: "#D1D1D1",
                                borderRadius: "20px",
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "20px", // Adjust the value as needed
                                },
                              }}
                              fullWidth
                            />
                          ) : (
                            <Box
                              sx={{
                                backgroundColor: "#D1D1D1",
                                padding: "8px 14px",
                                borderRadius: "16px",
                              }}
                            >
                              <Typography color={"#787878"} fontWeight={"bold"}>
                                {u.email}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>

                        {/* Password */}
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="password"
                              placeholder="Leave blank to keep current"
                              value={editFormData.password}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  password: e.target.value,
                                })
                              }
                              sx={{
                                backgroundColor: "#D1D1D1",
                                borderRadius: "20px",
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "20px", // Adjust the value as needed
                                },
                              }}
                              fullWidth
                            />
                          ) : (
                            <Box
                              sx={{
                                backgroundColor: "#D1D1D1",
                                padding: "8px 14px",
                                borderRadius: "16px",
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                ••••••••
                              </Typography>
                            </Box>
                          )}
                        </TableCell>

                        {/* User Group */}
                        <TableCell>
                          {/* <FormControl size="small" fullWidth>
                              <InputLabel>User Groups</InputLabel>
                              <Select
                                multiple
                                disabled={!isEditing}
                                value={
                                  isEditing
                                    ? editFormData.user_groups || u.user_groups
                                    : u.user_groups
                                }
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    user_groups: e.target.value,
                                  })
                                }
                                label="User Groups"
                                MenuProps={MenuProps}
                              >
                                {userGroups.map((group) => (
                                  <MenuItem key={group} value={group}>
                                    {group}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl> */}
                          <MultiSelect
                            disabled={!isEditing}
                            options={userGroups}
                            placeholder={"Select Groups"}
                            value={
                              isEditing
                                ? editFormData.user_groups || u.user_groups
                                : u.user_groups
                            }
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                user_groups: e.target.value,
                              })
                            }
                            sx={{
                              backgroundColor: "#D1D1D1",
                              borderRadius: "20px",
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "20px", // Adjust the value as needed
                              },
                            }}
                            width={240}
                          />
                        </TableCell>

                        {/* Active Status */}
                        <TableCell>
                          {isEditing ? (
                            <IOSSwitch
                              disabled={isThisRootAdmin}
                              checked={editFormData.is_active}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  is_active: e.target.checked,
                                })
                              }
                              size="small"
                            />
                          ) : (
                            <IOSSwitch
                              checked={u.Is_active}
                              disabled
                              size="small"
                            />
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ width: "220px" }}>
                          {isEditing ? (
                            <Box>
                              {/* <Tooltip title="Save Changes"> */}
                              <Button
                                variant="contained"
                                sx={{
                                  backgroundColor: "#5E5E5E",
                                  height: "32px",
                                  borderRadius: "16px",
                                  marginX: "20px",
                                  "&:hover": {
                                    backgroundColor: "#5E5E5E", // Hover color
                                  },
                                }}
                                disableElevation
                                onClick={() => handleSaveEdit(u.username)}
                              >
                                Save
                              </Button>
                              {/* <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleSaveEdit(u.username)}
                                  >
                                    <SaveIcon />
                                  </IconButton> */}
                              {/* </Tooltip> */}
                              <Tooltip title="Cancel">
                                <IconButton
                                  size="small"
                                  onClick={handleCancelEdit}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <>
                              <Button
                                variant="contained"
                                sx={{
                                  backgroundColor: "#5E5E5E",
                                  height: "32px",
                                  borderRadius: "16px",
                                  marginX: "20px",
                                  "&:hover": {
                                    backgroundColor: "#5E5E5E", // Hover color
                                  },
                                }}
                                disableElevation
                                onClick={() => handleStartEdit(u)}
                              >
                                Update
                              </Button>
                              {/* <Tooltip title="Edit User">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleStartEdit(u)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip> */}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default UserManagementDashboard;
