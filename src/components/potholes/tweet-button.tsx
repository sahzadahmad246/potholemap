"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Twitter } from "lucide-react"
import type { IPotholePopulated } from "@/types/pothole"

interface TweetButtonProps {
  pothole: IPotholePopulated
  className?: string
  size?: "default" | "sm" | "lg" | "icon" | null | undefined
}

const TweetButton: React.FC<TweetButtonProps> = ({ pothole, className, size = "lg" }) => {
  const handleTweet = () => {
    if (!pothole) return

    const potholeUrl = `${window.location.origin}/potholes/${pothole._id}`;

    // Twitter shortens URLs to 23 characters.
    const tCoLinkLength = 23;
    const totalLinksLength = tCoLinkLength; // Only accounting for the pothole URL now

    // Maximum characters for tweet text, accounting for the single link
    const maxTextLength = 280 - totalLinksLength;

    let tweetText = ``;

    const officials = pothole.taggedOfficials || [];
    const officialHandles = officials
      .map((o) => (o.twitterHandle ? `@${o.twitterHandle}` : o.name || o.role))
      .filter(Boolean); // Filter out any null/undefined names/roles

    if (officialHandles.length > 0) {
      tweetText += `Dear ${officialHandles.slice(0, 3).join(" ")}`; // Limit to 3 handles to save space
    } else {
      tweetText += `Dear local authorities`;
    }

    tweetText += `,\nUrgent! Pothole reported at ${pothole.address}. `;
    
    // Condense title and description
    let coreMessage = `"${pothole.title}". ${pothole.description}.`;
    
    // Ensure the core message doesn't exceed the available space
    const remainingTextSpace = maxTextLength - tweetText.length - (potholeUrl.length > 0 ? 1 : 0); // Account for space before URL

    if (coreMessage.length > remainingTextSpace) {
      coreMessage = coreMessage.substring(0, remainingTextSpace - 3) + "...";
    }
    
    tweetText += coreMessage;
    
    tweetText += ` Fix it! Details:`; // Concise call to action


    // Combine text and the single pothole URL
    const fullTweet = `${tweetText}\n${potholeUrl}`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullTweet)}`;
    window.open(twitterUrl, "_blank");
  };

  return (
     <Button
      onClick={handleTweet}
      className={`bg-blue-500 hover:bg-blue-600 text-white font-semibold ${className}`}
      size={size}
    >
      <Twitter className="h-5 w-5 mr-2" />
      Tweet about this Pothole
    </Button>
  );
};

export default TweetButton;