import React, { useState } from "react";
const API_BASE = process.env.REACT_APP_API_URL || "https://may-space-backend.onrender.com";

const Postunit = () => {
	const [buildingName, setBuildingName] = useState("");
	const [unitNumber, setUnitNumber] = useState("");
	const [location, setLocation] = useState("");
	const [specs, setSpecs] = useState("");
	const [specialFeatures, setSpecialFeatures] = useState("");
	const [unitPrice, setUnitPrice] = useState("");
	const [contactPerson, setContactPerson] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [images, setImages] = useState([]);
	const [message, setMessage] = useState("");

	const handleImageChange = (e) => {
		const files = Array.from(e.target.files);
		Promise.all(files.map(file => {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result); // base64 string
				reader.onerror = reject;
				reader.readAsDataURL(file);
			});
		})).then(base64Images => {
			setImages(base64Images);
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage("");
		const userId = localStorage.getItem("userId");
		if (!userId) {
			setMessage("Please log in to post a unit.");
			return;
		}
		try {
			const res = await fetch(`${API_BASE}/units`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-User-ID": userId
				},
				body: JSON.stringify({
					buildingName,
					unitNumber,
					location,
					specs,
					specialFeatures,
					unitPrice,
					contactPerson,
					phoneNumber,
					images // array of base64 strings
				})
			});
			const data = await res.json();
			if (!res.ok) {
				setMessage(data.message || "Failed to post unit.");
			} else {
				setMessage("Unit posted successfully!");
				setBuildingName("");
				setUnitNumber("");
				setLocation("");
				setSpecs("");
				setSpecialFeatures("");
				setUnitPrice("");
				setContactPerson("");
				setPhoneNumber("");
				setImages([]);
			}
		} catch (err) {
			setMessage("Error posting unit: " + err.message);
		}
	};

	return (
		<div className="postunit-container">
			<h2>Post a New Unit</h2>
			<form onSubmit={handleSubmit}>
				<input type="text" placeholder="Building Name" value={buildingName} onChange={e => setBuildingName(e.target.value)} required />
				<input type="text" placeholder="Unit Number" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} required />
				<input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} required />
				<input type="text" placeholder="Specifications" value={specs} onChange={e => setSpecs(e.target.value)} required />
				<input type="text" placeholder="Special Features" value={specialFeatures} onChange={e => setSpecialFeatures(e.target.value)} />
				<input type="number" placeholder="Unit Price" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required />
				<input type="text" placeholder="Contact Person" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required />
				<input type="text" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
				<input type="file" multiple accept="image/*" onChange={handleImageChange} />
				<button type="submit">Post Unit</button>
			</form>
			{message && <div className="postunit-message">{message}</div>}
			{images.length > 0 && (
				<div className="preview-images">
					<h4>Image Preview:</h4>
					{images.map((img, idx) => (
						<img key={idx} src={img} alt={`Preview ${idx + 1}`} style={{ maxWidth: 120, margin: 4 }} />
					))}
				</div>
			)}
		</div>
	);
};

export default Postunit;
