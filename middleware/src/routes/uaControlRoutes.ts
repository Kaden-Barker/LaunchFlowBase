import express from 'express';
import { db } from '../config/dbConnection';

const router = express.Router();

/**
 * GET /api/usergroups
 * 
 * Retrieves all user groups.
 * 
 * Returns an array of all user groups where each group object contains:
 * - groupID: number
 * - groupName: string
 */
router.get("/usergroups", async (req, res) => {
    try {
        const rows = await db("UserGroups").select("*");
        res.json(rows);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Database query error" });
    }
});

/**
 * POST /api/usergroups
 * 
 * Creates a new user group.
 * 
 * Request Body:
 * - groupName: string (required)
 * 
 * Returns:
 * - message: string
 * - groupID: number (the ID of the newly created group)
 */
router.post("/usergroups", async (req, res) => {
    const { groupName } = req.body;
    if (!groupName) {
        res.status(400).json({ error: "groupName is required" });
        return;
    }
    try {
        // Check for duplicate groupName
        const existing = await db("UserGroups").where({ groupName }).first();
        if (existing) {
            res.status(400).json({ error: "A group with this name already exists" });
            return;
        }
        const result = await db("UserGroups").insert({ groupName });
        res.status(201).json({
            message: "UserGroup created successfully",
            groupID: result[0]
        });
    } catch (error: any) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Database insert error" });
    }
});

/**
 * PUT /api/usergroups/:id
 * 
 * Updates an existing user group by its ID.
 * 
 * URL Parameters:
 * - id: The ID of the group to update
 * 
 * Request Body:
 * - newGroupName: string (required)
 * 
 * Returns:
 * - message: string
 */
router.put("/usergroups/:id", async (req, res) => {
    const { id } = req.params;
    const { newGroupName } = req.body;
    if (!newGroupName) {
        res.status(400).json({ error: "newGroupName is required" });
        return;
    }
    try {
        // Check for duplicate groupName
        const existing = await db("UserGroups").where({ groupName: newGroupName }).andWhereNot({ groupID: id }).first();
        if (existing) {
            res.status(400).json({ error: "A group with this name already exists" });
            return;
        }
        const result = await db("UserGroups")
            .where("groupID", id)
            .update({ groupName: newGroupName });
        if (result === 0) {
            res.status(404).json({ error: "UserGroup not found" });
            return;
        }
        res.json({ message: "UserGroup updated successfully" });
    } catch (error: any) {
        console.error("Database update error:", error);
        res.status(500).json({ error: "Database update error" });
    }
});

/**
 * DELETE /api/usergroups/:id
 * 
 * Deletes a user group by ID.
 * 
 * URL Parameters:
 * - id: The ID of the group to delete
 * 
 * Returns:
 * - message: string
 */
router.delete("/usergroups/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db("UserGroups").where("groupID", id).delete();
        if (result === 0) {
            res.status(404).json({ error: "UserGroup not found" });
            return;
        }
        res.status(200).json({ message: "UserGroup deleted successfully" });
    } catch (error) {
        console.error("Database delete error:", error);
        res.status(500).json({ error: "Database delete error" });
    }
});

/**
 * GET /api/users
 * 
 * Retrieves all users with their group information.
 * 
 * Returns an array of all users where each user object contains:
 * - userID: number
 * - userName: string
 * - userEmail: string
 * - groupID: number | null
 * - groupName: string | null (from joined UserGroups table)
 */
router.get("/users", async (req, res) => {
    try {
        const rows = await db("Users")
            .select("Users.*", "UserGroups.groupName")
            .leftJoin("UserGroups", "Users.groupID", "UserGroups.groupID");
        res.json(rows);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Database query error" });
    }
});

/**
 * POST /api/users
 * 
 * Creates a new user.
 * 
 * Request Body:
 * - userName: string (required)
 * - userEmail: string (required)
 * - groupID: number (optional)
 * 
 * Returns:
 * - message: string
 * - userID: number (the ID of the newly created user)
 */
router.post("/users", async (req, res) => {
    const { userName, userEmail, groupID } = req.body;
    if (!userName) {
        res.status(400).json({ error: "userName is required" });
        return;
    }
    if (!userEmail) {
        res.status(400).json({ error: "userEmail is required" });
        return;
    }
    try {
        // Check for duplicate userEmail
        const existing = await db("Users").where({ userEmail }).first();
        if (existing) {
            res.status(400).json({ error: "A user with this email already exists" });
            return;
        }
        const result = await db("Users").insert({
            userName,
            userEmail,
            groupID: groupID || null
        });
        res.status(201).json({
            message: "User created successfully",
            userID: result[0]
        });
    } catch (error: any) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Database insert error" });
    }
});

/**
 * PUT /api/users/:id
 * 
 * Updates an existing user.
 * 
 * URL Parameters:
 * - id: The ID of the user to update
 * 
 * Request Body:
 * - newUserName: string (required)
 * - newUserEmail: string (required)
 * - newGroupID: number (optional)
 * 
 * Returns:
 * - message: string
 */
router.put("/users/:id", async (req, res) => {
    const { id } = req.params;
    const { newUserName, newUserEmail, newGroupID } = req.body;
    if (!newUserName) {
        res.status(400).json({ error: "newUserName is required" });
        return;
    }
    if (!newUserEmail) {
        res.status(400).json({ error: "newUserEmail is required" });
        return;
    }
    try {
        const result = await db("Users")
            .where("userID", id)
            .update({
                userName: newUserName,
                userEmail: newUserEmail,
                groupID: newGroupID || null
            });
        if (result === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ message: "User updated successfully" });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "A user with this email already exists" });
            return;
        }
        console.error("Database update error:", error);
        res.status(500).json({ error: "Database update error" });
    }
});

/**
 * DELETE /api/users/:id
 * 
 * Deletes a user by ID.
 * 
 * URL Parameters:
 * - id: The ID of the user to delete
 * 
 * Returns:
 * - message: string
 */
router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db("Users").where("userID", id).delete();
        if (result === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Database delete error:", error);
        res.status(500).json({ error: "Database delete error" });
    }
});

/**
 * GET /api/permissiongroup
 * 
 * Retrieves all permission group assignments.
 * 
 * Returns an array of all permission group assignments where each object contains:
 * - permissionID: number
 * - groupID: number
 * - permissionName: string (from joined Permissions table)
 * - groupName: string (from joined UserGroups table)
 */
router.get("/permissiongroup", async (req, res) => {
    try {
        const rows = await db("PermissionGroup")
            .select("PermissionGroup.*", "Permissions.permissionName", "UserGroups.groupName")
            .leftJoin("Permissions", "PermissionGroup.permissionID", "Permissions.permissionID")
            .leftJoin("UserGroups", "PermissionGroup.groupID", "UserGroups.groupID");
        res.json(rows);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Database query error" });
    }
});

/**
 * POST /api/permissiongroup
 * 
 * Creates a new permission group assignment.
 * 
 * Request Body:
 * - permissionID: number (required)
 * - groupID: number (required)
 * 
 * Returns:
 * - message: string
 */
router.post("/permissiongroup", async (req, res) => {
    const { permissionID, groupID } = req.body;
    if (!permissionID || !groupID) {
        res.status(400).json({ error: "permissionID and groupID are required" });
        return;
    }
    try {
        await db("PermissionGroup").insert({
            permissionID,
            groupID
        });
        res.status(201).json({
            message: "PermissionGroup created successfully"
        });
    } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: "Database insert error" });
    }
});

/**
 * DELETE /api/permissiongroup
 * 
 * Deletes a permission group assignment.
 * 
 * Query Parameters:
 * - permissionID: number (required)
 * - groupID: number (required)
 * 
 * Returns:
 * - message: string
 */
router.delete("/permissiongroup", async (req, res) => {
    const { permissionID, groupID } = req.query;
    if (!permissionID || !groupID) {
        res.status(400).json({ error: "permissionID and groupID are required" });
        return;
    }
    try {
        const result = await db("PermissionGroup")
            .where({
                permissionID: permissionID,
                groupID: groupID
            })
            .delete();
        if (result === 0) {
            res.status(404).json({ error: "PermissionGroup not found" });
            return;
        }
        res.status(200).json({ message: "PermissionGroup deleted successfully" });
    } catch (error) {
        console.error("Database delete error:", error);
        res.status(500).json({ error: "Database delete error" });
    }
});

/**
 * GET /api/permissions
 * 
 * Retrieves all available permissions.
 * 
 * Returns an array of all permissions where each object contains:
 * - permissionID: number
 * - permissionName: string
 */
router.get("/permissions", async (req, res) => {
    try {
        const rows = await db("Permissions")
            .select("permissionID", "permissionName");
        res.json(rows);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Database query error" });
    }
});

export default router;