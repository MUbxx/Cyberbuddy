import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
setDoc,
updateDoc,
deleteDoc,
arrayUnion,
arrayRemove
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
signOut,
onAuthStateChanged,
sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const usersList=document.getElementById("usersList");
const coursesList=document.getElementById("coursesList");

const totalUsers=document.getElementById("totalUsers");
const totalCourses=document.getElementById("totalCourses");
const totalEnrollments=document.getElementById("totalEnrollments");


function toast(msg){
const t=document.getElementById("toast");
t.innerText=msg;
t.classList.remove("hidden");
setTimeout(()=>t.classList.add("hidden"),2000);
}



onAuthStateChanged(auth,async(user)=>{

if(!user){
window.location="login.html";
return;
}

const snap=await getDoc(doc(db,"users",user.uid));

if(!snap.exists() || snap.data().role!=="admin"){
alert("Unauthorized");
window.location="dashboard.html";
return;
}

loadDashboard();

});



async function loadDashboard(){

usersList.innerHTML="";
coursesList.innerHTML="";

const users=await getDocs(collection(db,"users"));
const courses=await getDocs(collection(db,"courses"));

totalUsers.innerText=users.size;
totalCourses.innerText=courses.size;

let enrollments=0;

const courseNames=[];

courses.forEach(c=>{
courseNames.push(c.id);

coursesList.innerHTML+=`
<div class="glass p-3 rounded flex justify-between">

<div>
<p class="font-bold">${c.id}</p>
<p class="text-xs text-gray-400">${c.data().description}</p>
</div>

<button onclick="deleteCourse('${c.id}')"
class="bg-red-500 px-2 py-1 text-xs rounded">
Delete
</button>

</div>
`;

});


users.forEach(u=>{

const d=u.data();
const owned=d.purchasedCourses || [];

enrollments+=owned.length;

const tr=document.createElement("tr");

tr.innerHTML=`

<td class="p-3">${d.name}</td>

<td class="p-3">${d.email}</td>

<td class="p-3 text-green-400 text-xs">
${owned.join(", ") || "None"}
</td>

<td class="p-3">

<select id="course-${u.id}" class="bg-gray-900 text-xs">

<option value="">Course</option>

${courseNames.map(c=>`<option value="${c}">${c}</option>`).join("")}

</select>

</td>

<td class="p-3">

<button onclick="grant('${u.id}')"
class="bg-cyan-500 px-2 py-1 text-xs rounded">
Grant
</button>

<button onclick="revoke('${u.id}')"
class="bg-yellow-500 px-2 py-1 text-xs rounded ml-2">
Revoke
</button>

<button onclick="deleteUser('${u.id}')"
class="bg-red-500 px-2 py-1 text-xs rounded ml-2">
Delete
</button>

</td>
`;

usersList.appendChild(tr);

});

totalEnrollments.innerText=enrollments;

}



/* GRANT */

window.grant=async(uid)=>{

const course=document.getElementById(`course-${uid}`).value;

if(!course){
toast("Select course");
return;
}

await updateDoc(doc(db,"users",uid),{
purchasedCourses:arrayUnion(course)
});

toast("Course granted");

loadDashboard();

};



/* REVOKE */

window.revoke=async(uid)=>{

const course=document.getElementById(`course-${uid}`).value;

if(!course){
toast("Select course");
return;
}

await updateDoc(doc(db,"users",uid),{
purchasedCourses:arrayRemove(course)
});

toast("Course revoked");

loadDashboard();

};



/* DELETE USER */

window.deleteUser=async(uid)=>{

if(!confirm("Delete user?")) return;

await deleteDoc(doc(db,"users",uid));

toast("User deleted");

loadDashboard();

};



/* DELETE COURSE */

window.deleteCourse=async(id)=>{

if(!confirm("Delete course?")) return;

await deleteDoc(doc(db,"courses",id));

toast("Course deleted");

loadDashboard();

};



/* UPLOAD COURSE */

document.getElementById("uploadBtn").onclick=async()=>{

const title=document.getElementById("title").value;
const description=document.getElementById("description").value;
const thumbnail=document.getElementById("thumbnail").value;
const video=document.getElementById("video").value;

if(!title || !description || !thumbnail || !video){
toast("Fill all fields");
return;
}

await setDoc(doc(db,"courses",title),{
title,
description,
thumbnail,
video
});

toast("Course uploaded");

loadDashboard();

};



/* PASSWORD RESET */

document.getElementById("resetPassword").onclick=async()=>{

const email=document.getElementById("resetEmail").value;

if(!email){
toast("Enter email");
return;
}

await sendPasswordResetEmail(auth,email);

toast("Reset email sent");

};



/* USER SEARCH */

document.getElementById("userSearch").addEventListener("input",function(){

const q=this.value.toLowerCase();

document.querySelectorAll("#usersList tr").forEach(r=>{
r.style.display=r.innerText.toLowerCase().includes(q)?"":"none";
});

});



/* LOGOUT */

document.getElementById("logoutBtn").onclick=async()=>{
await signOut(auth);
window.location="login.html";
};



/* TABS */

document.querySelectorAll(".navBtn").forEach(btn=>{

btn.onclick=()=>{
document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
document.getElementById(btn.dataset.tab).classList.add("active");
};

});
