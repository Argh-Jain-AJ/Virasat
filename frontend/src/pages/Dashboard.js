import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFamilies, createFamily } from "../services/familyService";

const Dashboard = () => {
  const navigate = useNavigate();

  const [families, setFamilies] = useState([]);
  const [error, setError] = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    try {
      const response = await getFamilies();

      // normalize backend response
      const familyList = response?.data || response || [];

      setFamilies(familyList);
    } catch (err) {
      console.error("Fetch families error:", err);
      setError("Failed to fetch families.");
    }
  };

  const handleFamilySelect = (e) => {
    const familyId = e.target.value;

    if (familyId) {
      localStorage.setItem("selectedFamily", familyId);
      navigate("/family-tree");
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();

    if (!newFamilyName.trim()) {
      setError("Family name cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await createFamily({
        family_name: newFamilyName.trim(),
      });

      // normalize response
      const createdFamily = response?.data || response;

      if (!createdFamily?.id) {
        throw new Error("Invalid family response");
      }

      localStorage.setItem("selectedFamily", createdFamily.id);

      navigate("/family-tree");
    } catch (err) {
      console.error("Create family error:", err);
      setError("Failed to create family.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Family Dashboard
        </h1>
      </div>

      {error && (
        <p className="text-red-600 mb-4 bg-red-50 p-3 rounded border border-red-200">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Create Family */}
        <section className="bg-white p-5 rounded-xl shadow border border-gray-100">

          <h3 className="text-lg font-semibold mb-3 border-b pb-2">
            Create Family
          </h3>

          <form onSubmit={handleCreateFamily} className="flex flex-col gap-3">

            <input
              placeholder="Family Name"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              required
              className="px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create & Enter Tree"}
            </button>

          </form>

        </section>

        {/* Select Family */}
        <section className="bg-white p-5 rounded-xl shadow border border-gray-100">

          <h3 className="text-lg font-semibold mb-3 border-b pb-2">
            Select Family Context
          </h3>

          <select
            onChange={handleFamilySelect}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 bg-white"
            defaultValue=""
          >

            <option value="" disabled>
              -- Select a Family --
            </option>

            {families.map((fam) => (
              <option key={fam.id} value={fam.id}>
                {fam.family_name}
              </option>
            ))}

          </select>

        </section>

      </div>
    </div>
  );
};

export default Dashboard;