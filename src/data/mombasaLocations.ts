export interface SubLocation {
    name: string;
}

export interface Ward {
    name: string;
    subLocations: SubLocation[];
}

export interface SubCounty {
    name: string;
    wards: Ward[];
}

export const MOMBASA_LOCATIONS: SubCounty[] = [
    {
        name: "Changamwe",
        wards: [
            {
                name: "Port Reitz",
                subLocations: [
                    { name: "Port Reitz" },
                    { name: "Bomu" }
                ]
            },
            {
                name: "Kipevu",
                subLocations: [
                    { name: "Kipevu" },
                    { name: "Simu ya Upepo" }
                ]
            },
            {
                name: "Airport",
                subLocations: [
                    { name: "Airport" },
                    { name: "Bokole" }
                ]
            },
            {
                name: "Changamwe",
                subLocations: [
                    { name: "Changamwe" },
                    { name: "Miritini Estate" } // Note: Miritini is also a ward in Jomvu, need to be careful with overlaps if any, but this is specific to Changamwe ward context
                ]
            },
            {
                name: "Chaani",
                subLocations: [
                    { name: "Chaani" },
                    { name: "Mwara Heshima" }
                ]
            }
        ]
    },
    {
        name: "Jomvu",
        wards: [
            {
                name: "Jomvu Kuu",
                subLocations: [
                    { name: "Jomvu Kuu" },
                    { name: "Jomvu Mkanjuni" },
                    { name: "Ng'ombeni" }
                ]
            },
            {
                name: "Miritini",
                subLocations: [
                    { name: "Miritini" },
                    { name: "Vikobani" }
                ]
            },
            {
                name: "Mikindani",
                subLocations: [
                    { name: "Mikindani" },
                    { name: "Kwashee" }
                ]
            }
        ]
    },
    {
        name: "Kisauni",
        wards: [
            {
                name: "Mjambere",
                subLocations: [
                    { name: "Mjambere" },
                    { name: "Kisauni Estate" }
                ]
            },
            {
                name: "Junda",
                subLocations: [
                    { name: "Junda" },
                    { name: "Mshomoroni" }
                ]
            },
            {
                name: "Bamburi",
                subLocations: [
                    { name: "Bamburi" },
                    { name: "Kiembeni" },
                    { name: "Vescon" }
                ]
            },
            {
                name: "Mwakirunge",
                subLocations: [
                    { name: "Mwakirunge" },
                    { name: "Marimani" }
                ]
            },
            {
                name: "Mtopanga",
                subLocations: [
                    { name: "Mtopanga" },
                    { name: "Bakarani" }
                ]
            },
            {
                name: "Magogoni",
                subLocations: [
                    { name: "Magogoni" },
                    { name: "Shanzu Creek" }
                ]
            },
            {
                name: "Shanzu",
                subLocations: [
                    { name: "Shanzu" },
                    { name: "Utange" }
                ]
            }
        ]
    },
    {
        name: "Nyali",
        wards: [
            {
                name: "Frere Town",
                subLocations: [
                    { name: "Frere Town" },
                    { name: "Kisimani" }
                ]
            },
            {
                name: "Ziwa la Ng'ombe",
                subLocations: [
                    { name: "Ziwa la Ng'ombe" },
                    { name: "Bombolulu" }
                ]
            },
            {
                name: "Mkomani",
                subLocations: [
                    { name: "Mkomani" },
                    { name: "Kongowea Market" }
                ]
            },
            {
                name: "Kongowea",
                subLocations: [
                    { name: "Kongowea" },
                    { name: "Karisa Maitha" }
                ]
            },
            {
                name: "Kadzandani",
                subLocations: [
                    { name: "Kadzandani" },
                    { name: "Mabondeni" }
                ]
            }
        ]
    },
    {
        name: "Likoni",
        wards: [
            {
                name: "Mtongwe",
                subLocations: [
                    { name: "Mtongwe" },
                    { name: "Vijiweni" }
                ]
            },
            {
                name: "Shika Adabu",
                subLocations: [
                    { name: "Shika Adabu" },
                    { name: "Kibundani" }
                ]
            },
            {
                name: "Bofu",
                subLocations: [
                    { name: "Bofu" },
                    { name: "Majengo Mapya" }
                ]
            },
            {
                name: "Likoni",
                subLocations: [
                    { name: "Likoni" },
                    { name: "Shelly Beach" }
                ]
            },
            {
                name: "Timbwani",
                subLocations: [
                    { name: "Timbwani" },
                    { name: "Ujamaa" }
                ]
            }
        ]
    },
    {
        name: "Mvita",
        wards: [
            {
                name: "Mji wa Kale/Makadara",
                subLocations: [
                    { name: "Mji wa Kale" },
                    { name: "Makadara" },
                    { name: "Kizingo" }
                ]
            },
            {
                name: "Tudor",
                subLocations: [
                    { name: "Tudor" },
                    { name: "Tudor Four" },
                    { name: "Norah" }
                ]
            },
            {
                name: "Tononoka",
                subLocations: [
                    { name: "Tononoka" },
                    { name: "Bondeni" }
                ]
            },
            {
                name: "Majengo",
                subLocations: [
                    { name: "Majengo" },
                    { name: "King'orani" }
                ]
            },
            {
                name: "Ganjoni/Shimanzi",
                subLocations: [
                    { name: "Ganjoni" },
                    { name: "Shimanzi" },
                    { name: "Railway" }
                ]
            }
        ]
    }
];
