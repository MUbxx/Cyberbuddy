import { auth, db } from "./firebase.js";
import {
    collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
    signOut, onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* DOM */
const usersList = document.getElementById("usersList");
const coursesList = document.getElementById("coursesList");
const totalUsers = document.getElementById("totalUsers");
const totalCourses = document.getElementById("totalCourses");
const totalEnrollments = document.getElementById("totalEnrollments");

function toast(msg) {
    const t = document.getElementById("toast");
    if(t) {
        t.innerText = msg;
        t.classList.remove("hidden");
        setTimeout(() => t.classList.add("hidden"), 2000);
    }
}

/* AUTH CHECK */
onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location = "login.html"; return; }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists() || snap.data().role !== "admin") {
        alert("Unauthorized");
        window.location = "dashboard.html";
        return;
    }
    loadDashboard();
});

/* GLOBAL EXPORTS - This fixes the "Unclickable" issue */
window.showTab = (tabId) => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const target = document.getElementById(tabId);
    if (target) target.classList.add("active");
    
    // Update Sidebar Active State
    document.querySelectorAll(".navBtn").forEach(btn => {
        btn.classList.toggle("bg-slate-800", btn.dataset.tab === tabId);
    });
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

window.updateUserName = async (uid) => {
    const newName = document.getElementById(`name-${uid}`).value;
    await updateDoc(doc(db, "users", uid), { name: newName });
    toast("Name updated");
    loadDashboard();
};

window.deleteUser = async (uid) => {
    if (!confirm("Delete user?")) return;
    await deleteDoc(doc(db, "users", uid));
    toast("User deleted");
    loadDashboard();
};

window.deleteCourse = async (id) => {
    if (!confirm("Delete course?")) return;
    await deleteDoc(doc(db, "courses", id));
    toast("Course deleted");
    loadDashboard();
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

window.addLesson = async (course, module) => {
    const title = document.getElementById(`lesson-title-${course}-${module}`).value;
    const video = document.getElementById(`lesson-video-${course}-${module}`).value;
    if (!title || !video) return toast("Fill lesson fields");
    await addDoc(collection(db, "courses", course, "modules", module, "lessons"), { title, video });
    toast("Lesson added");
};

/* DASHBOARD LOADERS */
async function loadDashboard() {
    usersList.innerHTML = "<tr><td colspan='6' class='p-5 text-center'>Loading...</td></tr>";
    coursesList.innerHTML = "Loading...";

    const usersSnap = await getDocs(collection(db, "users"));
    const coursesSnap = await getDocs(collection(db, "courses"));

    totalUsers.innerText = usersSnap.size;
    totalCourses.innerText = coursesSnap.size;

    let enrollments = 0;
    const courseNames = [];

    coursesList.innerHTML = "";
    coursesSnap.forEach(c => {
        courseNames.push(c.id);
        coursesList.innerHTML += `
        <div class="glass p-4 rounded mb-4">
            <div class="flex justify-between items-center mb-2">
                <p class="font-bold text-cyan-400">${c.data().title || c.id}</p>
                <button onclick="deleteCourse('${c.id}')" class="bg-red-500 text-xs px-2 py-1 rounded">Delete</button>
            </div>
            <div class="flex gap-2 mb-4">
                <input id="module-${c.id}" placeholder="New Module Name" class="bg-gray-900 text-xs p-2 rounded flex-1">
                <button onclick="addModule('${c.id}')" class="bg-green-600 text-xs px-3 rounded">Add Module</button>
            </div>
            <div id="modules-${c.id}" class="space-y-2"></div>
        </div>`;
        loadModules(c.id);
    });

    usersList.innerHTML = "";
    usersSnap.forEach(u => {
        const d = u.data();
        const owned = d.purchasedCourses || [];
        enrollments += owned.length;
        const tr = document.createElement("tr");
        tr.className = "border-b border-gray-800 text-xs";
        tr.innerHTML = `
            <td class="p-3">${d.name || 'N/A'}</td>
            <td class="p-3 text-gray-400">${d.email}</td>
            <td class="p-3 text-green-400">${owned.join(", ") || "None"}</td>
            <td class="p-3">
                <select id="course-${u.id}" class="bg-gray-900 border border-gray-700 rounded p-1">
                    <option value="">Select</option>
                    ${courseNames.map(name => `<option value="${name}">${name}</option>`).join("")}
                </select>
            </td>
            <td class="p-3"><input id="name-${u.id}" value="${d.name || ''}" class="bg-gray-900 border border-gray-700 p-1 w-20"></td>
            <td class="p-3 flex gap-1">
                <button onclick="updateUserName('${u.id}')" class="bg-blue-600 px-2 py-1 rounded">Save</button>
                <button onclick="grant('${u.id}')" class="bg-cyan-600 px-2 py-1 rounded">Grant</button>
                <button onclick="revoke('${u.id}')" class="bg-yellow-600 px-2 py-1 rounded">Revoke</button>
                <button onclick="deleteUser('${u.id}')" class="bg-red-600 px-2 py-1 rounded">X</button>
            </td>`;
        usersList.appendChild(tr);
    });
    totalEnrollments.innerText = enrollments;
}

window.loadModules = async (courseId) => {
    const container = document.getElementById(`modules-${courseId}`);
    if(!container) return;
    const mods = await getDocs(collection(db, "courses", courseId, "modules"));
    container.innerHTML = "";
    mods.forEach(m => {
        container.innerHTML += `
        <div class="bg-slate-900/50 p-2 rounded border border-slate-800 text-xs mb-2">
            <p class="font-bold mb-2">${m.id}</p>
            <input id="lesson-title-${courseId}-${m.id}" placeholder="Lesson Title" class="bg-gray-800 p-1 rounded w-full mb-1">
            <input id="lesson-video-${courseId}-${m.id}" placeholder="Video ID" class="bg-gray-800 p-1 rounded w-full mb-2">
            <button onclick="addLesson('${courseId}','${m.id}')" class="bg-cyan-500 text-black px-2 py-1 rounded w-full font-bold">Add Lesson</button>
        </div>`;
    });
};

/* STATIC LISTENERS */
document.getElementById("createCourse").onclick = async () => {
    const title = document.getElementById("courseTitle").value;
    const desc = document.getElementById("courseDescription").value;
    const img = document.getElementById("courseImage").value;
    if (!title || !desc || !img) return toast("Fill all fields");
    await setDoc(doc(db, "courses", title), { title, description: desc, image: img });
    toast("Course created");
    loadDashboard();
};

document.getElementById("logoutBtn").onclick = async () => { await signOut(auth); window.location = "login.html"; };

document.getElementById("resetPassword").onclick = async () => {
    const email = document.getElementById("resetEmail").value;
    if(!email) return toast("Enter email");
    await sendPasswordResetEmail(auth, email);
    toast("Reset email sent");
};
