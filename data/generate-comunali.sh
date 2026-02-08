python3 convert_addizionali_comunali.py -o ../src/calculator/addizionali/2020.comunali.ts Add_comunale_irpef2020.csv
python3 convert_addizionali_comunali.py -o ../src/calculator/addizionali/2021.comunali.ts --update ../src/calculator/addizionali/2020.comunali.ts Add_comunale_irpef2021.csv
python3 convert_addizionali_comunali.py -o ../src/calculator/addizionali/2022.comunali.ts --update ../src/calculator/addizionali/2021.comunali.ts Add_comunale_irpef2022.csv
python3 convert_addizionali_comunali.py -o ../src/calculator/addizionali/2023.comunali.ts --update ../src/calculator/addizionali/2022.comunali.ts Add_comunale_irpef2023.csv
python3 convert_addizionali_comunali.py -o ../src/calculator/addizionali/2024.comunali.ts --update ../src/calculator/addizionali/2023.comunali.ts Add_comunale_irpef2024.csv
python3 convert_addizionali_comunali.py -o ../src/calculator/addizionali/2025.comunali.ts --update ../src/calculator/addizionali/2024.comunali.ts Add_comunale_irpef2025.csv
python3 convert_addizionali_comunali.py -o ../src/calculator/addizionali/2026.comunali.ts --update ../src/calculator/addizionali/2025.comunali.ts Add_comunale_irpef2026.csv
rm ../src/calculator/addizionali/2020.comunali.ts
rm ../src/calculator/addizionali/2021.comunali.ts
rm ../src/calculator/addizionali/2022.comunali.ts
rm ../src/calculator/addizionali/2023.comunali.ts
rm ../src/calculator/addizionali/2024.comunali.ts
rm ../src/calculator/addizionali/2025.comunali.ts
cd ..
npm run format
cd data