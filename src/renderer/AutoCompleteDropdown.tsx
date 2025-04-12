import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// const frameworks = [
//   {
//     value: 'next.js',
//     label: 'Next.js',
//   },
//   {
//     value: 'sveltekit',
//     label: 'SvelteKit',
//   },
//   {
//     value: 'nuxt.js',
//     label: 'Nuxt.js',
//   },
//   {
//     value: 'remix',
//     label: 'Remix',
//   },
//   {
//     value: 'astro',
//     label: 'Astro',
//   },
// ];

export default function AutoCompleteDropdown({
  itemList,
  value,
  onChange,
  // label,
  placeholder,
}: {
  itemList: { label: string; value: string }[];
  value: { label: string; value: string } | null;
  onChange: (value: { label: string; value: string }) => void;
  // label: string;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);
  // const [value, setValue] = React.useState('');

  console.log('value', value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="max-w-full text-ellipsis overflow-hidden">
            {value
              ? itemList.find((item) => item.value === value?.value)?.label
              : placeholder}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {itemList.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentItemId) => {
                    const selectedItem = itemList.find(
                      (i) => i.value === currentItemId,
                    );
                    if (selectedItem && selectedItem?.value !== value?.value) {
                      onChange(selectedItem);
                    }
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      'ml-auto',
                      value?.value === item.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// export function AutoCompleteDropdown({
//   fileExtensionsList,
//   selectedFileExtensionId,
//   setSelectedFileExtensionId,
//   label,
//   placeholder,
// }: {
//   fileExtensionsList: { extension: string; name: string }[];
//   selectedFileExtensionId: string;
//   setSelectedFileExtensionId: (value: string) => void;
//   label: string;
//   placeholder: string;
// }) {
//   const [searchTerm, setSearchTerm] = useState('');

//   const filteredExtensions = fileExtensionsList.filter(
//     (ext) =>
//       ext.extension.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       ext.name.toLowerCase().includes(searchTerm.toLowerCase()),
//   );

//   return (
//     <div>
//       <label htmlFor="fileExtension">
//         {label}
//         <input
//           type="text"
//           placeholder={placeholder}
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="autocomplete-input"
//           style={{
//             width: '100%',
//             padding: '8px',
//             marginBottom: '8px',
//             border: '1px solid #ccc',
//             borderRadius: '4px',
//             fontSize: '14px',
//           }}
//         />
//         <select
//           id="fileExtension"
//           className="dropdown"
//           value={selectedFileExtensionId}
//           onChange={(e) => setSelectedFileExtensionId(e.target.value)}
//           style={{
//             width: '100%',
//             padding: '8px',
//             border: '1px solid #ccc',
//             borderRadius: '4px',
//             fontSize: '14px',
//             backgroundColor: '#fff',
//           }}
//         >
//           <option value="" disabled>
//             Select a file format
//           </option>
//           {filteredExtensions.map((ext) => (
//             <option key={ext.extension} value={ext.extension}>
//               {ext.extension} - {ext.name}
//             </option>
//           ))}
//         </select>
//       </label>
//     </div>
//   );
// }

// export default AutoCompleteDropdown;
