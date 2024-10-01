<Query Kind="Statements">
  <NuGetReference>Newtonsoft.Json</NuGetReference>
  <Namespace>BTR.Evolution.Core</Namespace>
  <Namespace>BTR.Evolution.Data</Namespace>
  <Namespace>Newtonsoft.Json.Linq</Namespace>
</Query>

var dashboards = JObject.Parse( File.ReadAllText( @"c:\btr\documentation\kat\evolutiondashboards.json" ) );

var clients = dashboards.Children().Cast<JProperty>().OrderBy( c => c.Name ).ToArray();
var mid = (clients.Length + 1) / 2;

var firstColumn = clients.Take(mid).ToList();
var secondColumn = clients.Skip(mid).ToList();

var sb = new StringBuilder();
sb.AppendLine("| | |");
sb.AppendLine("| --- | --- |");
for (var i = 0; i < mid; i++)
{
	var col1 = i < firstColumn.Count ? $"[{firstColumn[i].Name}]({(string)firstColumn[i]})" : "";
	var col2 = i < secondColumn.Count ? $"[{secondColumn[i].Name}]({(string)secondColumn[i]})" : "";
	sb.AppendLine($"| {col1} | {col2} |");
}

sb.ToString().Dump();