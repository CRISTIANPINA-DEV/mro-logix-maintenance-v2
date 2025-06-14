"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UsefulLink {
  url: string;
  topic: string;
  description?: string;
}

const usefulLinks: UsefulLink[] = [
  {
    url: "https://www.airbus.com/en",
    topic: "Airbus",
    description: "European aircraft manufacturer - commercial aviation, helicopters, and space systems"
  },
  {
    url: "https://arc.aiaa.org/",
    topic: "American Institute of Aeronautics and Astronautics",
    description: "American Institute of Aeronautics and Astronautics - Technical resources and publications"
  },
  {
    url: "https://asn.flightsafety.org",
    topic: "Aviation Safety Network",
    description: "Comprehensive database of aviation accidents, incidents, and safety occurrences since 1919"
  },
  {
    url: "https://tc.canada.ca/en/aviation",
    topic: "Canadian Aviation Regulations",
    description: "Transport Canada Aviation - Canadian aviation regulations and guidelines"
  },
  {
    url: "https://cessna.txtav.com",
    topic: "Cessna Aircraft Company",
    description: "Textron Aviation - Citation jets, turboprops, and piston aircraft manufacturer resources"
  },
  {
    url: "https://www.cfmaeroengines.com/",
    topic: "CFM International",
    description: "CFM International - Leading aircraft engine manufacturer producing LEAP and CFM56 engines for commercial aviation"
  },
  {
    url: "https://www.easa.europa.eu/en",
    topic: "European Aviation Safety Agency",
    description: "EASA - European aviation safety regulation, certification, and environmental protection"
  },
  {
    url: "https://www.easa.europa.eu/en/document-library/type-certificates",
    topic: "European Aviation Safety Agency Type Certificates",
    description: "European Aviation Safety Agency - Aircraft type certificates and certification data"
  },
  {
    url: "https://embraer.com",
    topic: "Embraer",
    description: "Brazilian aerospace manufacturer - commercial, executive, and defense aircraft"
  },
  {
    url: "https://amsrvs.registry.faa.gov/airmeninquiry/",
    topic: "FAA Airmen Inquiry",
    description: "FAA database for searching pilot, mechanic, certificate information, medical certificates, and type ratings"
  },
  {
    url: "https://drs.faa.gov/browse",
    topic: "FAA Dynamic Regulatory System",
    description: "Comprehensive knowledge center with regulatory guidance documents and aviation standards"
  },
  {
    url: "https://nasstatus.faa.gov",
    topic: "FAA System Operations Status",
    description: "Real-time National Airspace System status, delays, and operational information"
  },
  {
    url: "https://www.faa.gov",
    topic: "Federal Aviation Administration",
    description: "Official FAA website - US aviation regulations, safety information, and guidance materials"
  },
  {
    url: "https://www.ecfr.gov/current/title-14",
    topic: "Federal Aviation Regulations (Title 14 CFR)",
    description: "Electronic Code of Federal Regulations Title 14 - Comprehensive US federal aviation regulations and standards"
  },
  {
    url: "https://www.icao.int/APAC/Meetings/2019%20COSCAPSEA%20iSTARS/9760_cons_en.pdf",
    topic: "ICAO Doc 9760 - Airworthiness Manual",
    description: "ICAO Document 9760 - Comprehensive airworthiness manual for aviation safety and aircraft certification standards"
  },
  {
    url: "https://www.icao.int/",
    topic: "International Civil Aviation Organization",
    description: "ICAO - UN specialized agency coordinating international air navigation principles and fostering safe aviation development"
  },
  {
    url: "https://www.iata.org/",
    topic: "International Air Transport Association",
    description: "IATA - Global airline industry standards, regulations, and aviation resources"
  },
  {
    url: "https://www.ntsb.gov/",
    topic: "National Transportation Safety Board",
    description: "NTSB - Aviation accident investigations and safety recommendations"
  },
  {
    url: "https://www.prattwhitney.com/en",
    topic: "Pratt & Whitney",
    description: "Aircraft engine manufacturer - commercial, military, and business aviation propulsion"
  },
  {
    url: "https://www.rolls-royce.com",
    topic: "Rolls-Royce",
    description: "Leading aerospace engine manufacturer - commercial and defense propulsion systems"
  },
  {
    url: "https://skybrary.aero",
    topic: "SKYbrary Aviation Safety",
    description: "Electronic repository of aviation safety knowledge for flight operations and air traffic management"
  },
  {
    url: "https://www.boeing.com",
    topic: "The Boeing Company",
    description: "American aerospace manufacturer - commercial airplanes, defense, and space systems"
  }
];

export default function UsefulLinksPage() {
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Aviation Resources & Regulatory Links</h1>
        <p className="text-muted-foreground mt-2">
          Essential aviation maintenance resources, technical documentation, and regulatory information for MRO professionals. 
          Access official guidelines, safety recommendations, and technical publications from leading aviation authorities.
        </p>
      </div>

      <div className="space-y-2">
        {usefulLinks.map((link, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary w-full h-fit rounded-none"
            onClick={() => handleLinkClick(link.url)}
          >
            <div className="flex items-center justify-between px-6 py-2">
              <div className="flex-1 min-w-0 flex items-center gap-8">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold text-primary truncate">
                    {link.topic}
                  </CardTitle>
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </div>
                <CardDescription className="text-xs font-mono text-muted-foreground truncate leading-tight min-w-0 flex-1">
                  {link.url}
                </CardDescription>
                {link.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 min-w-0 flex-2">
                    {link.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Clicking on any link will open the resource in a new tab. 
          These external resources are provided for reference and may have their own terms of use.
        </p>
      </div>
    </div>
  );
} 