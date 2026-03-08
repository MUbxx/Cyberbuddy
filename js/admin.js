import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
updateDoc,
arrayUnion,
arrayRemove,
addDoc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const usersList=document.getElementById("usersList");
const coursesList=document.getElementById("coursesList");

const totalUsers=document.getElementById("totalUsers");
const totalCourses=document.getElementById("totalCourses");
const totalEnrollments=document.getElementById("totalEnrollments");



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

const usersSnap=await getDocs(collection(db,"users"));
const coursesSnap=await getDocs(collection(db,"courses"));

totalUsers.innerText=usersSnap.size;
totalCourses.innerText=coursesSnap.size;

let enrollments=0;

const courses=[];

coursesSnap.forEach(c=>{

courses.push({id:c.id,...c.data()});

coursesList.innerHTML+=`

<div class="flex justify-between bg-gray-800 p-3 rounded">

<span>${c.data().title}</span>

<button onclick="deleteCourse('${c.id}')"
class="bg-red-500 text-white px-2 py-1 rounded text-xs">

Delete

</button>

</div>

`;

});

usersSnap.forEach(user=>{

const data=user.data();

const owned=data.purchasedCourses || [];

enrollments+=owned.length;

const created=data.createdAt?.toDate().toLocaleDateString() || "N/A";

const row=document.createElement("tr");

row.className="border-b border-gray-800";

row.innerHTML=`

<td class="p-4">${data.name}</td>

<td class="p-4">${data.email}</td>

<td class="p-4">${created}</td>

<td class="p-4 text-green-400 text-xs">
${owned.length>0?owned.join(", "):"None"}
</td>

<td class="p-4">

<select id="courseSelect-${user.id}"
class="bg-gray-900 p-1 text-xs">

<option value="">Course</option>

${courses.map(c=>`
<option value="${c.id}">${c.title}</option>
`).join("")}

</select>

</td>

<td class="p-4">

<button onclick="grantAccess('${user.id}',this)"
class="bg-cyan-500 text-black px-2 py-1 rounded text-xs">

Grant

</button>

<button onclick="revokeAccess('${user.id}',this)"
class="bg-yellow-500 text-black px-2 py-1 rounded text-xs ml-2">

Revoke

</button>

</td>

`;

usersList.appendChild(row);

});

totalEnrollments.innerText=enrollments;

}



/* GRANT ACCESS */

window.grantAccess=async(uid,btn)=>{

const select=document.getElementById(`courseSelect-${uid}`);
const courseId=select.value;

if(!courseId){
alert("Select course first");
return;
}

btn.disabled=true;
btn.innerText="Processing";

await updateDoc(doc(db,"users",uid),{
purchasedCourses:arrayUnion(courseId)
});

btn.innerText="Granted";

};



/* REVOKE ACCESS */

window.revokeAccess=async(uid)=>{

const select=document.getElementById(`courseSelect-${uid}`);
const courseId=select.value;

if(!courseId){
alert("Select course first");
return;
}

await updateDoc(doc(db,"users",uid),{
purchasedCourses:arrayRemove(courseId)
});

alert("Access revoked");

location.reload();

};



/* UPLOAD COURSE */

document.getElementById("uploadBtn").onclick=async()=>{

const title=document.getElementById("title").value;
const video=document.getElementById("video").value;

if(!title || !video){
alert("Fill all fields");
return;
}

await addDoc(collection(db,"courses"),{
title,
video
});

alert("Course uploaded");

location.reload();

};



/* DELETE COURSE */

window.deleteCourse=async(id)=>{

if(!confirm("Delete course?")) return;

await deleteDoc(doc(db,"courses",id));

location.reload();

};



/* USER SEARCH */

document.getElementById("userSearch").addEventListener("input",function(){

const v=this.value.toLowerCase();

document.querySelectorAll("#usersList tr").forEach(row=>{

row.style.display=row.innerText.toLowerCase().includes(v)?"":"none";

});

});



/* LOGOUT */

document.getElementById("logoutBtn").onclick=async()=>{

await signOut(auth);

window.location="login.html";

};



/* TAB SWITCH */

window.showTab=(id)=>{

document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"));

document.getElementById(id).classList.remove("hidden");

};
