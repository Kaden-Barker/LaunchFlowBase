import HamburgerNav from "@/components/hamburgerNav";
import { useNavigate } from "react-router-dom";

const HelpPage = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  const helpSections = [
    {
      title: "Editing Tables",
      description: "Learn about the relationship between categories, groups and fields and how to add new ones",
      content: [
        "What are categories, groups and fields and how do I add new ones?",
        "What are the rules for adding new categories, groups and fields?",
        "What is an Dropdown type?",
        "What do I do if I make a typo and need to fix it?",
        "Examples of categories, groups and fields"
      ],
      path: "/helpEditingTables"
    },
    {
      title: "Inserting Data",
      description: "Learn how to insert data into the database",
      content: [
        "What is an Asset?",
        "How to actually add the data I have been collecting?",
        "What do I do if I make a mistake and added the data?"
      ],
      path: "/helpInsertingData"
    },
    {
      title: "Managing Data",
      description: "Learn how to update and delete data in the database",
      content: [
        "How do I navigate the form?",
        "What is an Asset?",
        "Why is there so many dates in the update form?",
        "How do I update the date of an entry",
        "Where do I delete data?"
      ],
      path: "/helpManagingData"
    },
    {
      title: "Searching Data",
      description: "Learn how to search data in the database",
      content: [
        "How do I search for data?",
        "Why is there so many dates in the search results?",
        "How do I filter the search results?",
        "What is a DSL Query?"
      ],
      path: "/helpSearchingData"
    },
    {
      title: "Managing Users",
      description: "Learn how to manage users in the database",
      content: [
        "How do I add a new user?",
        "How do I delete a user?",
        "What are groups?",
        "How do I change the permissions a group has?"
      ],
      path: "/helpManagingUsers"
    },
    {
      title: "Change Log",
      description: "Learn what is the change log",
      content: [
        "What is the change log?",
        "What is the purpose of the change log?",
        "When are row added to the change log?",
      ],
      path: "/helpChangeLog"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-100">
      {/* Header Bar */}
      <header className="relative bg-[#876454] text-white shadow-lg flex items-center justify-center py-6 px-4 md:px-8">
        {/* Logo (top-left) */}
        <img 
          src="/LaunchFlowLogo.png"
          alt="RGF Logo" 
          className="absolute top-2 left-4 max-w-[150px] md:max-w-[165px] h-auto hidden min-[900px]:block"
        />

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
          Help Center
        </h1>

        {/* Hamburger Nav */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <HamburgerNav />
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">How can we help you?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpSections.map((section, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-[#876454]/20 hover:border-[#876454] relative group"
                onClick={() => navigate(section.path)}
              >
                <div className="absolute right-4 top-4 text-[#876454] opacity-50 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"> 
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[#876454] mb-2 group-hover:text-[#6d4f41] transition-colors flex items-center">
                  {section.title}
                  <span className="ml-2 text-sm text-[#876454]/70">(tap to view)</span>
                </h3>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <ul className="list-disc list-inside space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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

export default HelpPage;
