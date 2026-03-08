import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
updateDoc,
arrayUnion,
addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const usersList = document.getElementById("usersList");
const coursesList = document.getElementById("coursesList");
const totalUsers = document.getElementById("totalUsers");
const totalCourses = document.getElementById("totalCourses");


onAuthStateChanged(auth, async (user)=>{

if(!user){
window.location="login.html";
return;
}

const userRef = doc(db,"users",user.uid);
const userSnap = await getDoc(userRef);

if(!userSnap.exists()){
window.location="login.html";
return;
}

const data = userSnap.data();

if(data.role !== "admin"){
alert("Unauthorized access");
window.location="dashboard.html";
return;
}

loadDashboard();

});


async function loadDashboard(){

usersList.innerHTML="";
coursesList.innerHTML="";

const usersSnap = await getDocs(collection(db,"users"));
const courseSnap = await getDocs(collection(db,"courses"));

totalUsers.innerText = usersSnap.size;
totalCourses.innerText = courseSnap.size;

const courses=[];

courseSnap.forEach(c=>{

courses.push({id:c.id,...c.data()});

coursesList.innerHTML+=`
<div class="flex justify-between bg-gray-800 p-3 rounded">
<span>${c.data().title}</span>
<span class="text-xs text-green-400">Live</span>
</div>
`;

});


usersSnap.forEach(user=>{

const data=user.data();

const row=document.createElement("tr");

row.className="border-b border-gray-800";

row.innerHTML=`

<td class="p-4">${data.name || "User"}</td>

<td class="p-4 text-gray-400">${data.email}</td>

<td class="p-4">

<select id="courseSelect-${user.id}" class="bg-gray-900 border border-gray-700 p-2 text-xs rounded">

<option value="">Select Course</option>

${courses.map(c=>`
<option value="${c.id}">${c.title}</option>
`).join("")}

</select>

</td>

<td class="p-4">

<button onclick="grantAccess('${user.id}',this)"
class="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-3 py-1 rounded">

Grant

</button>

</td>

`;

usersList.appendChild(row);

});

}



window.grantAccess = async (uid,button)=>{

const select=document.getElementById(`courseSelect-${uid}`);
const courseId=select.value;

if(!courseId){
alert("Select course first");
return;
}

button.disabled=true;
button.innerText="Processing...";

try{

await updateDoc(doc(db,"users",uid),{
purchasedCourses:arrayUnion(courseId)
});

button.innerText="Granted";
button.classList.remove("bg-cyan-500");
button.classList.add("bg-green-500");

}catch(e){

button.innerText="Error";
button.disabled=false;

}

};



document.getElementById("uploadBtn").onclick = async()=>{

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



document.getElementById("logoutBtn").onclick = async()=>{

await signOut(auth);

window.location="login.html";

};
