import HamburgerNav from "@/components/hamburgerNav";
import { useNavigate } from "react-router-dom";

const HelpManagingData = () => {
  const navigate = useNavigate(); 

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page in history
  }

  const sections = [
    {
      title: "How to Navigate the Form",
      content: [
        "First choose what type of data you want to manage. You can choose to manage categories, groups, fields, or assets.",
        "Then you will be prompted with either another dropdown to refine your search or a table to view all of the data.",
        "Once your viewing the table each row will have a update and delete button.",
        "The update button will open a form where you can update the data for that specific row. This is where you can add new data or fix mistakes.",
        "The delete button will delete the row from the system. This is a permanent action and cannot be undone."
      ]
    },
    {
      title: "Updating Asset Data",
      content: [
        "Select asset as the type of data you want to manage",
        "Select the dropdowns to find the type of asset you want to update",
        "Scroll though the table to find the exact asset you want to update",
        "Click the update button to open the form",
        "Make your changes and click submit",
        "Note: All changes are automatically logged in the change log"
      ]
    },
    {
      title: "Understanding Dates",
      content: [
        "Each asset has multiple date fields that serve different purposes",
        "Their is a date store for when each field of an asset was last updated. For example, the date for the born weight of a cow will be different than the harvest weight date.",
        "When updating if you did the data collection on a different date, this is where you can select the actual date that the asset was collected.",
      ]
    },
    {
      title: "Deleting Data",
      content: [
        "Select asset as the type of data you want to manage",
        "Select the dropdowns to find the type of asset you want to update",
        "Scroll though the table to find the exact asset you want to delete",
        "Click the 'Delete' button next to the asset",
        "Confirm the deletion in the popup dialog",
        "<strong>Warning: This action will delete all data related to the deleted item. example: If your delete a category, all groups and fields and data associated with that category will also be deleted.</strong>"
      ]
    },
    {
      title: "Best Practices",
      content: [
        "Always verify you're updating the correct asset before making changes",
        "Keep track of when data was collected vs when it was entered -- The correct date can be entered here",
        "Use the change log to review recent modifications"
      ]
    },
    {
      title: "Tutorial Video",
      content: [
        "Click the video below to watch a tutorial on how to manage data",
        "This video will show you how to navigate the form and update data",
        "This video will also show you how to delete data"
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
          Managing Data
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

export default HelpManagingData;
