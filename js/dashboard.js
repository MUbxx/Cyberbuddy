import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
doc,
getDoc,
updateDoc,
setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
onAuthStateChanged,
signOut,
sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


/* ===============================
DOM
================================ */

const coursesGrid = document.getElementById("coursesGrid");
const myCoursesGrid = document.getElementById("myCoursesGrid");

const certList = document.getElementById("certList");
const invoiceList = document.getElementById("invoiceList");

const logoutBtn = document.getElementById("logoutBtn");
const resetBtn = document.getElementById("resetBtn");

const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");

const profilePhoto = document.getElementById("profilePhoto");
const photoUpload = document.getElementById("photoUpload");

const profileName = document.getElementById("profileName");
const profileEmailDisplay = document.getElementById("profileEmailDisplay");

const statCourses = document.getElementById("statCourses");
const statCertificates = document.getElementById("statCertificates");

const searchInput = document.getElementById("searchCourse");

let userData = null;
let allCourses = [];


/* ===============================
AUTH CHECK
================================ */

onAuthStateChanged(auth, async (user) => {

if (!user) {
window.location = "login.html";
return;
}

const savedPhoto = localStorage.getItem("profilePhoto");

if(savedPhoto){
profilePhoto.src = savedPhoto;
}

await loadUser(user);
await loadCourses();
await loadCertificates(user);
await loadInvoices(user);

});


/* ===============================
LOAD USER
================================ */

async function loadUser(user){

const snap = await getDoc(doc(db,"users",user.uid));

if(!snap.exists()) return;

userData = snap.data();

profileName.innerText = userData.name || "Student";
profileEmailDisplay.innerText = user.email;

editName.value = userData.name || "";
editPhone.value = userData.phone || "";

if(userData.photo){
profilePhoto.src = userData.photo;
localStorage.setItem("profilePhoto",userData.photo);
}

}


/* ===============================
LOAD COURSES
================================ */

async function loadCourses(){

coursesGrid.innerHTML="";
myCoursesGrid.innerHTML="";

const snap = await getDocs(collection(db,"courses"));

allCourses=[];

snap.forEach(docSnap=>{

const data = docSnap.data();
const id = docSnap.id;

allCourses.push({id,...data});

const access = userData?.purchasedCourses?.includes(id);

const card = createCourseCard(id,data,access);

coursesGrid.innerHTML += card;

if(access){
myCoursesGrid.innerHTML += card;
}

});

statCourses.innerText = userData?.purchasedCourses?.length || 0;

}


/* ===============================
COURSE CARD
================================ */

function createCourseCard(id,data,access){

const img = data.image || data.thumbnail || "https://via.placeholder.com/400x200";

return `
<div class="glass rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 transition">

<img src="${img}" class="w-full h-40 object-cover">

<div class="p-5">

<h3 class="font-bold text-lg mb-2">${data.title || id}</h3>

<p class="text-sm text-slate-400 mb-4">${data.description || ""}</p>

${access
? `<a href="https://mubyyy404.github.io/Cyber-Buddy/verify-certificate.html?id=${id}" class="bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm font-bold block text-center">Start Learning</a>`
: `<button class="w-full bg-slate-700 px-4 py-2 rounded-lg text-sm text-slate-400">Locked</button>`
}

</div>
</div>
`;

}


/* ===============================
SEARCH COURSES
================================ */

if(searchInput){

searchInput.addEventListener("input",()=>{

const q = searchInput.value.toLowerCase();

coursesGrid.innerHTML="";

allCourses.forEach(c=>{

if((c.title || "").toLowerCase().includes(q)){

const access = userData?.purchasedCourses?.includes(c.id);

coursesGrid.innerHTML += createCourseCard(c.id,c,access);

}

});

});

}


/* ===============================
PROFILE PHOTO UPLOAD
================================ */

if(photoUpload){

photoUpload.addEventListener("change",async function(){

const file = this.files[0];
if(!file) return;

const reader = new FileReader();

reader.onload = async ()=>{

const base64 = reader.result;

profilePhoto.src = base64;
localStorage.setItem("profilePhoto",base64);

const user = auth.currentUser;

await setDoc(
doc(db,"users",user.uid),
{ photo: base64 },
{ merge:true }
);

};

reader.readAsDataURL(file);

});

}


/* ===============================
UPDATE PHONE
================================ */

document.getElementById("saveProfile").onclick = async ()=>{

const phone = editPhone.value;
const user = auth.currentUser;

await setDoc(
doc(db,"users",user.uid),
{ phone },
{ merge:true }
);

alert("Profile updated");

};


/* ===============================
CERTIFICATES
================================ */

async function loadCertificates(user){

if(!certList) return;

try{

const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/certificates.json");
const data = await res.json();

const list = data.certificates.filter(c =>
c.email?.toLowerCase() === user.email.toLowerCase()
);

certList.innerHTML="";

list.forEach(c=>{

certList.innerHTML += `
<div class="glass p-5 rounded-xl flex justify-between items-center">

<div>
<h4 class="font-bold text-blue-400">${c.course}</h4>
<p class="text-xs text-slate-400">${c.type} • ${c.duration}</p>
</div>

<a href="https://mubyyy404.github.io/Cyber-Buddy/verify-certificate.html?id=${c.certId}"
class="bg-blue-600 px-4 py-2 rounded-lg text-xs">View</a>

</div>
`;

});

statCertificates.innerText = list.length;

}catch(e){
console.error(e);
}

}


/* ===============================
BILLING
================================ */

async function loadInvoices(user){

if(!invoiceList) return;

try{

const res = await fetch("https://raw.githubusercontent.com/Mubyyy404/Cyber-Buddy/main/bills.json");
const bills = await res.json();

const list = bills.filter(b =>
b.email?.toLowerCase() === user.email.toLowerCase()
);

invoiceList.innerHTML="";

list.forEach(b=>{

invoiceList.innerHTML += `
<div class="glass p-5 rounded-xl flex justify-between items-center">

<div>
<h4 class="font-bold text-green-400">${b.course}</h4>
<p class="text-xs text-slate-400">₹${b.amount} • ${b.date}</p>
</div>

<a href="${b.verifyUrl}" target="_blank"
class="bg-slate-800 px-4 py-2 rounded-lg text-xs">Verify</a>

</div>
`;

});

}catch(e){
console.error(e);
}

}


/* ===============================
PASSWORD RESET
================================ */

if(resetBtn){

resetBtn.onclick = async ()=>{

const user = auth.currentUser;
await sendPasswordResetEmail(auth,user.email);

alert("Password reset email sent");

};

}


/* ===============================
LOGOUT
================================ */

logoutBtn.onclick = async ()=>{

await signOut(auth);
window.location="login.html";

};

