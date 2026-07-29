import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User,UserPayload, CustomRequest } from "../libs/types.ts";

// import database
import { users, reset_users, enrollments } from "../db/db.js";
import { success } from "zod";
import { zStudentId } from "@src/libs/zodValidators.js";
import { zCoursePutBody } from "@src/libs/zodValidators.js";
const router = Router();

// GET /api/v2/users
router.get("/users", (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  if(!authHeader || !authHeader.startsWith("Bearer ")){
    return res.status(401).json({
      success : false,
      message : "Authorization header is require"
    });
  }
  const token = authHeader.split(" ")[1]
  if (token === null){
    return res.status(401).json({
      success:false,
      message:"Token is requried"
    })
  }
  const jwt_secret = process.env.JWT_SECRET;
  jwt.verify(token,jwt_secret||"this_is_my_awesome_secret_key",(err,payload) =>{
    if(err){
      return res.status(403).json({
      success:false,
      message:"Invalid or expired token"
    })
    }
    const user_payload = payload as UserPayload;
    const user = users.find((u => u.username === user_payload?.username));
    if(!user || user.role !== "ADMIN"){
    return res.status(403).json({
      success : false,
      message : "Unauthorized user"
    });
  }
    if(user.role === "ADMIN"){
      return res.status(200).json({
        ok : true,
        enrollments : enrollments
      });
    }
  })
  try {
    // return all users
    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

// POST /api/v2/users/login
router.post("/users/login", (req: Request, res: Response) => {
  // 1. get username and password from body
    const {username,password} =req.body;
    const user =users.find((u)=> u.username === username && u.password === password);
  // 2. check if user exists (search with username & password in DB)
    if(!user){
      return res.status(401).json({
        success: false,
        message : "Invalid username of password"
      });
    }
  // 3. create JWT token (with user info object as payload) using JWT_SECRET_KEY
  const jwt_secret = process.env.JWT_SECRET;
  const token = jwt.sign(
    {
      username : user.username,
      studentsId :user.studentId,
      role : user.role
    },
    jwt_secret||"this_is_my_awesome_secret_key",
    {expiresIn :"30m"}
  );
  //    (optional: save the token as part of User data)

  // 4. send HTTP response with JWT token
  return res.status(200).json({
    success: true,
    message :"Login successful",
    token : token
  })

  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/login has not been implemented yet",
  });
});

// POST /api/v2/users/logout
router.post("/users/logout", (req: Request, res: Response) => {
  // 1. check Request if "authorization" header exists
  //    and container "Bearer ...JWT-Token..."

  // 2. extract the "...JWT-Token..." if available

  // 3. verify token using JWT_SECRET_KEY and get payload (username, studentId and role)

  // 4. check if user exists (search with username)

  // 5. proceed with logout process and return HTTP response
  //    (optional: remove the token from User data)

  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/logout has not been implemented yet",
  });
});

// POST /api/v2/users/reset
router.post("/users/reset", (req: Request, res: Response) => {
  try {
    reset_users();
    return res.status(200).json({
      success: true,
      message: "User database has been reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});
//
router.post("/enrollments", (req: Request, res:Response)=>{
   const authHeader = req.headers["authorization"];
  if(!authHeader || !authHeader.startsWith("Bearer ")){
    return res.status(401).json({
      success : false,
      message : "Authorization header is require"
    });
  }
  const token = authHeader.split(" ")[1]
  if (token === null){
    return res.status(401).json({
      success:false,
      message:"Token is requried"
    })
  }
  const jwt_secret = process.env.JWT_SECRET;
  jwt.verify(token,jwt_secret||"this_is_my_awesome_secret_key",(err,payload) =>{
    if(err){
      return res.status(403).json({
      success:false,
      message:"Invalid or expired token"
    })
    }
    const user_payload = payload as UserPayload;
    const user = users.find((u => u.username === user_payload?.username));
    if(!user){
      return res.status(403).json({
      success : false,
      message : "Unauthorized user"
    });
    }
    if(user.role !== "ADMIN"){
    return res.status(200).json({
      ok : true,
      message : "This user is student"
    });
  }
    if(user.role === "ADMIN"){
      return res.status(403).json({
        ok : true,
        message:"Only Student can access this API route"
      });
    }
  })
});
//delete
router.delete("/enrollments", (req: Request, res:Response)=>{
   const authHeader = req.headers["authorization"];
  if(!authHeader || !authHeader.startsWith("Bearer ")){
    return res.status(401).json({
      success : false,
      message : "Authorization header is require"
    });
  }
  const token = authHeader.split(" ")[1]
  if (token === null){
    return res.status(401).json({
      success:false,
      message:"Token is requried"
    })
  }
  const jwt_secret = process.env.JWT_SECRET;
  jwt.verify(token,jwt_secret||"this_is_my_awesome_secret_key",(err,payload) =>{
    if(err){
      return res.status(403).json({
      success:false,
      message:"Invalid or expired token"
    })
    }
    const user_payload = payload as UserPayload;
    const user = users.find((u => u.username === user_payload?.username));
    if(!user){
      return res.status(403).json({
      success : false,
      message : "Unauthorized user"
    });
    }
    if(user.role !== "ADMIN"){
      const request = zCoursePutBody.safeParse(req.body);
        if (!request.success) {
            return res.status(404).json({
            ok: false,
            errors: request.error.issues[0]?.message,
        });
        }
        const {courseId} = req.body;
        let find_enroll=enrollments.findIndex((enrollment)=>
            enrollment.courseId ===courseId  && enrollment.studentId === user.studentId
        );
        if(find_enroll===-1){
            return res.status(404).json({
                ok: false,
                message: "Enrollment does not exist",
            });
        }
        enrollments.splice(find_enroll,1);
    return res.status(200).json({
      ok : true,
      message : "You has dropped from this course. See you next semester"
    });
  }
    if(user.role === "ADMIN"){
      return res.status(403).json({
        ok : true,
        message:"Only Student can access this API route"
      });
    }
  })
});

export default router;