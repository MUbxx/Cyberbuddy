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
    arrayRemove,
    addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* DOM ELEMENTS */
const usersList = document.getElementById("usersList");
const coursesList = document.getElementById("coursesList");
const totalUsers = document.getElementById("totalUsers");
const totalCourses = document.getElementById("totalCourses");
const totalEnrollments = document.getElementById("totalEnrollments");

/* UI UTILITIES */
function toast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), 2000);
}

/* AUTH & ROLE CHECK */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location = "login.html";
        return;
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists() || snap.data().role !== "admin") {
        alert("Unauthorized Access");
        window.location = "dashboard.html";
        return;
    }
    loadDashboard();
});

/* MAIN DASHBOARD LOADER */
async function loadDashboard() {
    if (!usersList || !coursesList) return;

    usersList.innerHTML = "<tr><td colspan='6' class='p-5 text-center'>Loading...</td></tr>";
    coursesList.innerHTML = "Loading courses...";

    const usersSnap = await getDocs(collection(db, "users"));
    const coursesSnap = await getDocs(collection(db, "courses"));

    totalUsers.innerText = usersSnap.size;
    totalCourses.innerText = coursesSnap.size;

    let enrollments = 0;
    const courseNames = [];

    /* 1. RENDER COURSES */
    coursesList.innerHTML = "";
    coursesSnap.forEach(c => {
        const data = c.data();
        courseNames.push(c.id);

        coursesList.innerHTML += `
        <div class="glass p-4 rounded space-y-3 mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-cyan-400">${data.title || c.id}</p>
                    <p class="text-xs text-gray-400">${data.description || "No description"}</p>
                </div>
                <button onclick="deleteCourse('${c.id}')" class="bg-red-500 hover:bg-red-600 px-2 py-1 text-xs rounded transition">
                    Delete Course
                </button>
            </div>
            <div class="flex gap-2">
                <input id="module-${c.id}" placeholder="New Module Name" class="bg-gray-900 border border-slate-700 p-2 rounded w-full text-sm">
                <button onclick="addModule('${c.id}')" class="bg-green-500 hover:bg-green-400 px-4 py-1 text-black rounded text-xs font-bold">
                    Add
                </button>
            </div>
            <div id="modules-${c.id}" class="space-y-2 mt-4"></div>
        </div>`;
        
        // Load modules for this course
        loadModules(c.id);
    });

    /* 2. RENDER USERS */
    usersList.innerHTML = "";
    usersSnap.forEach(u => {
        const d = u.data();
        const owned = d.purchasedCourses || [];
        enrollments += owned.length;

        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-800 hover:bg-slate-800/30 transition";
        tr.innerHTML = `
            <td class="p-3">${d.name || 'User'}</td>
            <td class="p-3 text-gray-400">${d.email}</td>
            <td class="p-3 text-green-400 text-xs font-mono">${owned.join(", ") || "None"}</td>
            <td class="p-3">
                <select id="course-${u.id}" class="bg-gray-900 border border-slate-700 text-xs p-1 rounded">
                    <option value="">Select Course</option>
                    ${courseNames.map(name => `<option value="${name}">${name}</option>`).join("")}
                </select>
            </td>
            <td class="p-3">
                <div class="flex gap-1">
                    <input id="name-${u.id}" value="${d.name || ''}" class="bg-gray-900 border border-slate-700 p-1 text-xs w-24 rounded">
                    <button onclick="updateUserName('${u.id}')" class="bg-blue-600 hover:bg-blue-500 px-2 py-1 text-xs rounded">Save</button>
                </div>
            </td>
            <td class="p-3">
                <div class="flex gap-2">
                    <button onclick="grant('${u.id}')" class="bg-cyan-600 hover:bg-cyan-500 px-2 py-1 text-xs rounded">Grant</button>
                    <button onclick="revoke('${u.id}')" class="bg-yellow-600 hover:bg-yellow-500 px-2 py-1 text-xs rounded">Revoke</button>
                    <button onclick="deleteUser('${u.id}')" class="bg-red-600 hover:bg-red-500 px-2 py-1 text-xs rounded"><i class="fas fa-trash"></i></button>
                </div>
            </td>`;
        usersList.appendChild(tr);
    });

    totalEnrollments.innerText = enrollments;
}

/* ===============================
   GLOBAL WINDOW EXPORTS (FIXES CLICKS)
================================ */

window.showTab = (tabId) => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const target = document.getElementById(tabId);
    if(target) target.classList.add("active");
};

window.addModule = async (courseId) => {
    const input = document.getElementById(`module-${courseId}`);
    const name = input.value.trim();
    if (!name) return toast("Enter module name");
    await setDoc(doc(db, "courses", courseId, "modules", name), { title: name });
    input.value = "";
    toast("Module added");
    loadModules(courseId);
};

window.loadModules = async (courseId) => {
    const container = document.getElementById(`modules-${courseId}`);
    if(!container) return;
    const mods = await getDocs(collection(db, "courses", courseId, "modules"));
    container.innerHTML = "";
    mods.forEach(m => {
        container.innerHTML += `
        <div class="bg-slate-900/50 p-3 rounded border border-slate-800">
            <div class="flex justify-between items-center mb-2">
                <p class="text-sm font-bold text-gray-300">${m.id}</p>
                <button onclick="deleteModule('${courseId}','${m.id}')" class="text-red-400 hover:text-red-300 text-xs">Delete</button>
            </div>
            <div class="space-y-2">
                <input id="lesson-title-${courseId}-${m.id}" placeholder="Lesson Title" class="bg-gray-800 border border-slate-700 p-1 rounded w-full text-xs">
                <input id="lesson-video-${courseId}-${m.id}" placeholder="Video URL" class="bg-gray-800 border border-slate-700 p-1 rounded w-full text-xs">
                <button onclick="addLesson('${courseId}','${m.id}')" class="bg-cyan-500 hover:bg-cyan-400 px-3 py-1 text-xs rounded text-black font-bold w-full">
                    Add Lesson
                </button>
            </div>
        </div>`;
    });
};

window.addLesson = async (course, module) => {
    const titleInput = document.getElementById(`lesson-title-${course}-${module}`);
    const videoInput = document.getElementById(`lesson-video-${course}-${module}`);
    if (!titleInput.value || !videoInput.value) return toast("Fill all fields");
    
    await addDoc(collection(db, "courses", course, "modules", module, "lessons"), {
        title: titleInput.value,
        video: videoInput.value
    });
    titleInput.value = ""; videoInput.value = "";
    toast("Lesson added");
};

window.deleteModule = async (course, module) => {
    if (!confirm("Delete module?")) return;
    await deleteDoc(doc(db, "courses", course, "modules", module));
    toast("Module deleted");
    loadModules(course);
};

window.updateUserName = async (uid) => {
    const newName = document.getElementById(`name-${uid}`).value;
    await updateDoc(doc(db, "users", uid), { name: newName });
    toast("Name updated");
    loadDashboard();
};

window.grant = async (uid) => {
    const course = document.getElementById(`course-${uid}`).value;
    if(!course) return toast("Select a course");
    await updateDoc(doc(db, "users", uid), { purchasedCourses: arrayUnion(course) });
    toast("Course granted");
    loadDashboard();
};

window.revoke = async (uid) => {
    const course = document.getElementById(`course-${uid}`).value;
    if(!course) return toast("Select a course");
    await updateDoc(doc(db, "users", uid), { purchasedCourses: arrayRemove(course) });
    toast("Course revoked");
    loadDashboard();
};

window.deleteCourse = async (id) => {
    if (!confirm("Delete course?")) return;
    await deleteDoc(doc(db, "courses", id));
    toast("Course deleted");
    loadDashboard();
};

window.deleteUser = async (uid) => {
    if (!confirm("Delete user?")) return;
    await deleteDoc(doc(db, "users", uid));
    toast("User deleted");
    loadDashboard();
};

/* EVENT LISTENERS (NON-DYNAMIC) */
document.getElementById("createCourse").onclick = async () => {
    const title = document.getElementById("courseTitle").value;
    const description = document.getElementById("courseDescription").value;
    const image = document.getElementById("courseImage").value;
    if (!title || !description || !image) return toast("Fill all fields");

    await setDoc(doc(db, "courses", title), { title, description, image });
    toast("Course created");
    loadDashboard();
};

document.getElementById("resetPassword").onclick = async () => {
    const email = document.getElementById("resetEmail").value;
    if(!email) return toast("Enter email");
    await sendPasswordResetEmail(auth, email);
    toast("Reset email sent");
};

document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location = "login.html";
};

/* TAB SWITCHER */
document.querySelectorAll(".navBtn").forEach(btn => {
    btn.onclick = () => {
        window.showTab(btn.dataset.tab);
    };
});
