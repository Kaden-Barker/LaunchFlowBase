import HamburgerNav from "@/components/hamburgerNav";
import { useNavigate } from "react-router-dom";

const HelpChangeLog = () => {
  const navigate = useNavigate(); 

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page in history
  }

  const sections = [
    {
      title: "What is the change log?",
      content: [
        "The change log is a list of changes that have been made to the system.",
        "It is a way for us to keep track of the changes that have been made to the system.",
        "This also allows us to backtrace the logs of what is being entered just in case something gets deleted. Still be very careful with the delete however this is a possible way to recover data."        
      ]
    },
    {
      title: "When are rows added to the change log?",
      content: [
        "Each row of the log contains a users email, the action that was taken, more detail about the action, and the date and time of the action.",
        "Rows are added to the change log when a user adds, updates, or deletes data. This includes adding new categories, groups, and fields.",
        "The log will also keep track of when a users permissions are changed.",
        "The log is not editable, and cannot be deleted."
      ]
    },
    {
      title: "Tutorial Video",
      content: [
        "Click the video below to watch a tutorial on how to use the change log",
        "This video will show you how to view the change log",
        "This video will also show you how to interpret the change log"
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-100">
      {/* Header Bar */}
      <header className="relative bg-[#876454] text-white shadow-lg flex items-center justify-center py-6 px-4 md:px-8">
        {/* Logo (top-left) */}
        <img 
          src="/rgf_logo.png"
          alt="RGF Logo" 
          className="absolute top-2 left-4 max-w-[150px] md:max-w-[165px] h-auto hidden min-[900px]:block"
        />

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
          Change Log
        </h1>

        {/* Hamburger Nav */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <HamburgerNav />
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-[#876454] mb-4">{section.title}</h2>
              <div className="text-gray-700">
                {Array.isArray(section.content) ? (
                  <ul className="list-disc list-inside space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700" dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                  </ul>
                ) : (
                  <div className="whitespace-pre-line">{section.content}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-8 ml-6 sm:ml-10 pb-8">
        <button
          onClick={handleBackClick}
          className="px-6 py-2 sm:px-8 sm:py-3 bg-gray-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-gray-700 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default HelpChangeLog;
