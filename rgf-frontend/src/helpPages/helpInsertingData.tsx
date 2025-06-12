import HamburgerNav from "@/components/hamburgerNav";
import { useNavigate } from "react-router-dom";

const HelpInsertingData = () => {
  const navigate = useNavigate(); 

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous page in history
  }

  const sections = [
    {
      title: "What is an Asset?",
      content: [
        "An asset is any entry that stores data. Assets are an entry of a group.",
        "For example, a cow could be an asset in the 'Livestock' category, 'Cattle' group, with fields like 'Weight', 'Sex', and 'Health Status'.",
        "Everytime you insert data you are creating a new asset. This means that it is important for you to think if the asset may already exist and your just updating it, or are you adding a new cow.",
        "A good example of this is everytime you go into the field and you collect some kind of produce, you will most likely be adding a new asset.",
        "However, when a cow is first entered it may not have all of the data because weights are collected at different times. This is a good example of an asset that already exists and needs to be updated. Actions like this can be handled in the 'Manage Data' section."
      ]
    },
    {
      title: "How to Add Data",
      content: [
        "Navigate to the 'Add Data' section from the main menu",
        "Select the appropriate category and group for your asset",
        "Fill in all required fields in the form",
        "Review your entries for accuracy",
        "Click 'Submit' to save the data",
      ]
    },
    {
      title: "What if I Make a Mistake?",
      content: [
        "If you've already submitted the data:",
        "Navigate to the 'Manage Data' section",
        "Find the entry you need to correct",
        "Use the edit function to make your changes",
        "The system will automatically log these changes in the change log"
      ]
    },
    {
      title: "Best Practices",
      content: [
        "Always double-check your entries before submitting",
        "Look at the units for each field and make sure you are entering the data in the correct unit",
      ]
    },
    {
      title: "Tutorial Video",
      content: ["Tutorial video displaying how to add data to the system"]
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
          Inserting Data
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
                      <li key={itemIndex} className="text-gray-700">{item}</li>
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

export default HelpInsertingData;
