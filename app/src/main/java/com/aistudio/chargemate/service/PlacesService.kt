package com.aistudio.chargemate.service

import com.aistudio.chargemate.model.PlaceSuggestion

object PlacesService {
    val INDIAN_PLACES_DATABASE = listOf(
        PlaceSuggestion("pl-omr", "OMR IT Expressway Corridor", "OMR Sholinganallur, Chennai, Tamil Nadu", "South Chennai", "Tamil Nadu", "Tech Hub", 12.9010, 80.2279, "Rajiv Gandhi Salai (SH 49A)"),
        PlaceSuggestion("pl-guindy", "Guindy Olympia Tech Park", "Guindy, Chennai, Tamil Nadu", "Central Chennai", "Tamil Nadu", "Business District", 13.0067, 80.2030, "Grand Southern Trunk Road"),
        PlaceSuggestion("pl-chengalpattu", "GST Road Chengalpattu Toll", "Chengalpattu, Tamil Nadu", "South Outskirts", "Tamil Nadu", "Highway Corridor", 12.6939, 79.9757, "NH 32 / Chennai-Tiruchy Highway"),
        PlaceSuggestion("pl-sriperumbudur", "Sriperumbudur Industrial Corridor", "Sriperumbudur, Tamil Nadu", "West Corridor", "Tamil Nadu", "Industrial Corridor", 12.9675, 79.9436, "NH 48 / Chennai-Bengaluru Highway"),
        PlaceSuggestion("pl-orr", "Outer Ring Road (ORR) Minjur-Vandalur", "Vandalur Interchange, Chennai", "Ring Road Belt", "Tamil Nadu", "Highway Corridor", 12.8914, 80.0815, "State Highway 234"),
        PlaceSuggestion("pl-airport", "Chennai International Airport Aerocity", "Meenambakkam, Chennai", "Transit Hub", "Tamil Nadu", "Transit Hub", 12.9941, 80.1709, "GST Road / Airport Terminal"),
        PlaceSuggestion("pl-coimbatore", "Coimbatore Avinashi Road IT Belt", "Peelamedu, Coimbatore, Tamil Nadu", "Kongu Region", "Tamil Nadu", "Metro Hub", 11.0264, 77.0124, "NH 544 Salem-Kochi Highway"),
        PlaceSuggestion("pl-madurai", "Madurai Ring Road Express Hub", "Kappalur, Madurai, Tamil Nadu", "South Tamil Nadu", "Tamil Nadu", "Highway Corridor", 9.9252, 78.1198, "NH 44 Kashmir-Kanyakumari"),
        PlaceSuggestion("pl-trichy", "Tiruchirappalli Central Junction", "Cantonment, Tiruchy, Tamil Nadu", "Central Tamil Nadu", "Tamil Nadu", "Transit Hub", 10.7905, 78.7047, "NH 83 / NH 38 Corridor"),
        PlaceSuggestion("pl-salem", "Salem Expressway Interchange Hub", "Seelanaickenpatti, Salem, Tamil Nadu", "West Tamil Nadu", "Tamil Nadu", "Highway Corridor", 11.6643, 78.1460, "NH 44 / NH 544 Junction"),
        PlaceSuggestion("pl-blr-ecity", "Bengaluru Electronic City Phase 1", "Electronic City, Bengaluru, Karnataka", "South Bengaluru", "Karnataka", "Tech Hub", 12.8452, 77.6602, "Hosur Road Expressway (NH 44)"),
        PlaceSuggestion("pl-blr-wfield", "Whitefield ITPL Tech Corridor", "Whitefield, Bengaluru, Karnataka", "East Bengaluru", "Karnataka", "Tech Hub", 12.9863, 77.7340, "ITPL Main Road"),
        PlaceSuggestion("pl-blr-kia", "Kempegowda International Airport Devanahalli", "Devanahalli, Bengaluru, Karnataka", "North Transit", "Karnataka", "Transit Hub", 13.1986, 77.7066, "Bellary Road (NH 44)"),
        PlaceSuggestion("pl-hyd-hitec", "Hyderabad HITEC City Cyber Towers", "Madhapur, Hyderabad, Telangana", "Cyberabad", "Telangana", "Tech Hub", 17.4474, 78.3762, "Cyberabad Flyover Corridor"),
        PlaceSuggestion("pl-hyd-rgia", "Rajiv Gandhi International Airport Shamshabad", "Shamshabad, Hyderabad, Telangana", "Transit Hub", "Telangana", "Transit Hub", 17.2403, 78.4294, "PVNR Elevated Expressway"),
        PlaceSuggestion("pl-kochi", "Kochi Edappally LuLu Transit Deck", "Edappally, Kochi, Kerala", "Central Kerala", "Kerala", "Transit Hub", 10.0242, 76.3082, "NH 66 / NH 544 Junction"),
        PlaceSuggestion("pl-trivandrum", "Thiruvananthapuram Technopark", "Kazhakkoottam, Thiruvananthapuram, Kerala", "South Kerala", "Kerala", "Tech Hub", 8.5581, 76.8816, "NH 66 Coastal Highway"),
        PlaceSuggestion("pl-bkc", "Mumbai Bandra-Kurla Complex (BKC)", "Bandra East, Mumbai, Maharashtra", "MMR Central", "Maharashtra", "Business District", 19.0660, 72.8688, "BKC Connector / Western Express"),
        PlaceSuggestion("pl-mumbai-pune", "Mumbai-Pune Expressway Food Mall", "Khalapur Toll Plaza, Maharashtra", "Expressway Corridor", "Maharashtra", "Highway Corridor", 18.7903, 73.2842, "Mumbai-Pune Expressway (Yashwantrao Chavan)"),
        PlaceSuggestion("pl-pune-hinj", "Pune Hinjawadi Rajiv Gandhi Infotech Park", "Hinjawadi Phase 1, Pune, Maharashtra", "West Pune", "Maharashtra", "Tech Hub", 18.5913, 73.7389, "Mumbai-Bengaluru Highway (NH 48)"),
        PlaceSuggestion("pl-delhi-cp", "Delhi Connaught Place Radial Center", "Connaught Place, New Delhi, Delhi", "Central Capital", "Delhi NCR", "Commercial Core", 28.6315, 77.2167, "Inner & Outer Circle Roadways"),
        PlaceSuggestion("pl-delhi-aerocity", "Indira Gandhi International Airport Aerocity", "Aerocity, New Delhi, Delhi", "Transit Hub", "Delhi NCR", "Transit Hub", 28.5562, 77.1000, "Delhi-Gurugram Expressway (NH 48)"),
        PlaceSuggestion("pl-cybercity", "Gurugram DLF Cyber City Rapid Hub", "Cyber City, DLF Phase 2, Gurugram, Haryana", "NCR South", "Haryana", "Tech Hub", 28.4950, 77.0895, "Mehrauli-Gurgaon Road"),
        PlaceSuggestion("pl-noida", "Noida Sector 62 Electronic City Corridor", "Sector 62, Noida, Uttar Pradesh", "NCR East", "Uttar Pradesh", "Tech Hub", 28.6271, 77.3621, "Delhi-Meerut Expressway / NH 9")
    )

    fun searchIndianPlaces(query: String, userLat: Double? = null, userLng: Double? = null): List<PlaceSuggestion> {
        val clean = query.trim().lowercase()
        if (clean.isEmpty()) return INDIAN_PLACES_DATABASE.take(8)

        return INDIAN_PLACES_DATABASE
            .filter { place ->
                place.name.lowercase().contains(clean) ||
                place.fullName.lowercase().contains(clean) ||
                place.city.lowercase().contains(clean) ||
                place.state.lowercase().contains(clean) ||
                (place.popularHighway?.lowercase()?.contains(clean) == true)
            }
            .map { place ->
                if (userLat != null && userLng != null) {
                    val dist = GeoService.calculateHaversineDistanceKm(userLat, userLng, place.latitude, place.longitude)
                    place.copy(distanceKm = dist)
                } else place
            }
            .sortedBy { it.distanceKm ?: 0.0 }
    }
}

val PlaceSuggestion.city: String
    get() = region
