import HamburgerNav from "@/components/hamburgerNav";
import { useNavigate } from "react-router-dom";

const HelpEditingTables = () => {
  const navigate = useNavigate(); 

  const handleBackClick = () => {
    navigate(-1);
  }

  const sections = [
    {
      title: "Understanding Categories, Groups, and Fields",
      content: [
        "Categories are the top-level of organization in the system. They represent broad classifications of your assets (e.g., 'Livestock', 'Produce', 'Hay'). Categories must be unique.",
        "Groups are subdivisions within categories that provide more specific organization (e.g., under 'Livestock', you might have 'Cattle', 'Sheep', 'Chickens'). Groups must be unique within a category.",
        "Fields are the individual data points you track for each asset (e.g.'Yearling Weight', 'Weaning Weight', 'Amount'). Fields must be unique within a group."
      ]
    },
    {
      title: "Adding New Categories",
      content: [
        "Navigate to the 'Add Category' page from the main menu.",
        "Enter a descriptive name for your new category.",
        "Categories should be broad enough to group similar assets but specific enough to be meaningful.",
        "Duplicate categories are not allowed."
      ]
    },
    {
      title: "Adding New Groups",
      content: [
        "Navigate to the 'Add Group' page from the main menu.",
        "Select the category you want to add a group to.",
        "Choose a name that clearly identifies the type of assets in this group.",
        "Groups must be unique within a category.",
        "Produce may have a groups called Lettuce, Tomatoes, Roma Tomatoes, etc."
      ]
    },
    {
      title: "Adding New Fields",
      content: [
        "Navigate to the 'Add Field' page from the main menu.",
        "Choose a category and group and then choose a field name.",
        <>Choose appropriate field types (text, number, boolean.) based on the data you need to store, <strong>This cannot be changed later.</strong></>,
        "Units are always optional but are recommended for things like weight, height, length, etc.",
        "Fields must be unique within a group.",
        "Data integrity is of the upmost importance so think about how things may change in the future when adding new fields.",
        "Dropdowns are a special type of field that allows you to predefine the options for a field. Good examples of this are sex or locations. This is also known as an Enum."
      ]
    },
    {
      title: "Mistakes",
      content: [
        "If you make a mistake when creating a category, group or field there are a couple of options.",
        "First you can Navigate to the 'Manage Data' page and delete it completely. This is good if you haven't entered any data yet",
        "Second, if you already have some data in the system then you can navigate to the 'Manage Data' page and update whatever it is you need to fix.", 
      ]
    },
    {
      title: "Tutorial Video",
      content: [
        "Tutorial video displaying how to add new categories, groups and fields",
      ],
      video: "https://www.youtube.com/embed/J2UhMr-liY8"
    }
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
          Editing Tables Guide
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
            <div key={index} className="mb-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-[#876454] mb-4">{section.title}</h2>
              <ul className="list-disc list-inside space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-700">{item}</li>
                ))}
              </ul>
              {section.video && (
                <div className="mt-4 aspect-video w-full">
                  <iframe
                    src={section.video}
                    title="Tutorial Video"
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
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

export default HelpEditingTables;
