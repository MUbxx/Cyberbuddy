import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
setDoc,
updateDoc,
deleteDoc,
addDoc,
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


/* LOAD COURSES */

courses.forEach(c=>{

courseNames.push(c.id);

coursesList.innerHTML+=`

<div class="glass p-4 rounded space-y-3">

<div class="flex justify-between">

<div>
<p class="font-bold">${c.data().title}</p>
<p class="text-xs text-gray-400">${c.data().description}</p>
</div>

<button onclick="deleteCourse('${c.id}')" class="bg-red-500 px-2 py-1 text-xs rounded">
Delete
</button>

</div>

<input id="module-${c.id}" placeholder="Module Name"
class="bg-gray-900 p-2 rounded w-full">

<button onclick="addModule('${c.id}')" class="bg-green-500 px-3 py-1 text-black rounded text-xs">
Add Module
</button>

<div id="modules-${c.id}" class="space-y-2"></div>

</div>
`;

loadModules(c.id);

});



/* LOAD USERS */

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

<input id="name-${u.id}" value="${d.name}" class="bg-gray-900 p-1 text-xs w-32">

<button onclick="updateUserName('${u.id}')" class="bg-blue-500 px-2 py-1 text-xs rounded ml-1">
Save
</button>

</td>

<td class="p-3">

<button onclick="grant('${u.id}')" class="bg-cyan-500 px-2 py-1 text-xs rounded">
Grant
</button>

<button onclick="revoke('${u.id}')" class="bg-yellow-500 px-2 py-1 text-xs rounded ml-2">
Revoke
</button>

<button onclick="deleteUser('${u.id}')" class="bg-red-500 px-2 py-1 text-xs rounded ml-2">
Delete
</button>

</td>
`;

usersList.appendChild(tr);

});

totalEnrollments.innerText=enrollments;

}



/* CREATE COURSE */

document.getElementById("createCourse").onclick=async()=>{

const title=document.getElementById("courseTitle").value;
const description=document.getElementById("courseDescription").value;
const image=document.getElementById("courseImage").value;

await setDoc(doc(db,"courses",title),{
title,
description,
image
});

toast("Course created");

loadDashboard();

};



/* ADD MODULE */

window.addModule=async(courseId)=>{

const name=document.getElementById(`module-${courseId}`).value;

await setDoc(doc(db,"courses",courseId,"modules",name),{
title:name
});

toast("Module added");

loadModules(courseId);

};



async function loadModules(courseId){

const container=document.getElementById(`modules-${courseId}`);

container.innerHTML="";

const mods=await getDocs(collection(db,"courses",courseId,"modules"));

mods.forEach(m=>{

container.innerHTML+=`

<div class="bg-slate-900 p-3 rounded space-y-2">

<div class="flex justify-between">

<p class="text-sm font-bold">${m.id}</p>

<button onclick="deleteModule('${courseId}','${m.id}')" class="text-red-400 text-xs">
Delete
</button>

</div>

<input id="lesson-title-${courseId}-${m.id}"
placeholder="Lesson Title"
class="bg-gray-800 p-1 rounded w-full text-xs">

<input id="lesson-video-${courseId}-${m.id}"
placeholder="Video URL"
class="bg-gray-800 p-1 rounded w-full text-xs">

<button onclick="addLesson('${courseId}','${m.id}')"
class="bg-cyan-500 px-2 py-1 text-xs rounded text-black">
Add Lesson
</button>

</div>
`;

});

}



/* ADD LESSON */

window.addLesson=async(course,module)=>{

const title=document.getElementById(`lesson-title-${course}-${module}`).value;
const video=document.getElementById(`lesson-video-${course}-${module}`).value;

await addDoc(collection(db,"courses",course,"modules",module,"lessons"),{
title,
video
});

toast("Lesson added");

};



/* DELETE MODULE */

window.deleteModule=async(course,module)=>{

await deleteDoc(doc(db,"courses",course,"modules",module));

toast("Module deleted");

loadModules(course);

};



/* USER MANAGEMENT */

window.updateUserName=async(uid)=>{

const name=document.getElementById(`name-${uid}`).value;

await updateDoc(doc(db,"users",uid),{
name:name
});

toast("Name updated");

loadDashboard();

};



window.grant=async(uid)=>{

const course=document.getElementById(`course-${uid}`).value;

await updateDoc(doc(db,"users",uid),{
purchasedCourses:arrayUnion(course)
});

toast("Course granted");

};



window.revoke=async(uid)=>{

const course=document.getElementById(`course-${uid}`).value;

await updateDoc(doc(db,"users",uid),{
purchasedCourses:arrayRemove(course)
});

toast("Course revoked");

};



window.deleteUser=async(uid)=>{

await deleteDoc(doc(db,"users",uid));

toast("User deleted");

loadDashboard();

};



window.deleteCourse=async(id)=>{

await deleteDoc(doc(db,"courses",id));

toast("Course deleted");

loadDashboard();

};



/* PASSWORD RESET */

document.getElementById("resetPassword").onclick=async()=>{

const email=document.getElementById("resetEmail").value;

await sendPasswordResetEmail(auth,email);

toast("Reset email sent");

};



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
